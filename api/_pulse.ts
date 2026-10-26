// The numbers behind the floating "using the guide right now" counter and the
// heart (api/pulse.ts, api/heart.ts). Everything is anonymous: a tab is a random
// id it makes up and forgets, nobody is asked who they are, no cookie is set, and
// the only thing kept about a connection is an HMAC of its address that expires
// within the hour, so one address can't inflate the numbers. The store is a Redis
// connected through Vercel (Upstash, or Vercel's own Redis); with none connected
// the endpoints answer 503 and the page simply shows nothing.

import { createHmac } from 'node:crypto';

export type Cmd = (string | number)[];
/** Runs a batch of Redis commands in one round trip, one result per command. */
export type Redis = (cmds: Cmd[]) => Promise<unknown[]>;

export const HERE_WINDOW_MS = 60_000;
const PINGS_PER_MINUTE = 120;   // one address; a school or office behind one still fits
const HEARTS_PER_HOUR = 5;

/**
 * The store Vercel's integration connected, or null. Two kinds are understood:
 * Upstash over HTTPS (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_*)
 * and Vercel's own Redis over a connection string (REDIS_URL / KV_URL), each also
 * behind a custom prefix. `secret` keys the address hash; it never leaves the server.
 */
export function connect(env: Record<string, string | undefined> = process.env): { redis: Redis; secret: string } | null {
  const find = (...suffixes: string[]) => { const k = Object.keys(env).find((n) => suffixes.some((s) => n === s || n.endsWith(`_${s}`)) && env[n]); return k ? env[k]! : ''; };
  const url = find('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
  const token = find('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
  if (/^https:\/\//.test(url) && token) {
    const redis: Redis = async (cmds) => {
      const r = await fetch(`${url.replace(/\/$/, '')}/pipeline`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmds), signal: AbortSignal.timeout(4_000) });
      if (!r.ok) throw new Error(`store ${r.status}`);
      return ((await r.json()) as { result?: unknown; error?: string }[]).map((x) => { if (x.error) throw new Error(x.error); return x.result; });
    };
    return { redis, secret: token };
  }
  const conn = find('REDIS_URL');
  if (/^rediss?:\/\//.test(conn)) return { redis: tcp(conn), secret: conn };
  return null;
}

/** One connection per server instance, opened on first use and opened again if it drops. */
function tcp(url: string): Redis {
  type Client = { connect(): Promise<unknown>; multi(): { addCommand(c: string[]): unknown; execAsPipeline(): Promise<unknown[]> }; destroy(): void; on(e: string, f: () => void): unknown };
  let client: Promise<Client> | null = null;
  const open = () => (client ??= import('redis').then(async ({ createClient }) => {
    const c = createClient({ url, socket: { connectTimeout: 4_000, reconnectStrategy: false } }) as unknown as Client;
    c.on('error', () => { client = null; try { c.destroy(); } catch { /* already closed */ } });
    await c.connect();
    return c;
  }).catch((e) => { client = null; throw e; }));
  return async (cmds) => {
    const m = (await open()).multi();
    for (const c of cmds) m.addCommand(c.map(String));
    const out = await m.execAsPipeline();
    for (const r of out) if (r instanceof Error) throw r;
    return out;
  };
}

/** The visitor's address as an opaque key: HMAC with the store's own token, so it can't be reversed or matched across sites. */
export const addressKey = (ip: string, secret: string) => createHmac('sha256', secret).update(ip).digest('hex').slice(0, 24);

const centralDay = (now: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(now);

export interface Pulse { here: number; today: number; hearts: number; heartAt: number }

/** Counts this tab as here, and reads the numbers. A tab is "here" for a minute after its last ping. */
export async function ping(redis: Redis, id: string, ip: string, now = Date.now()): Promise<Pulse> {
  const day = `kyb:day:${centralDay(now)}`;
  const rate = `kyb:ping:${ip}`;
  const [count] = await redis([['INCR', rate], ['EXPIRE', rate, 60, 'NX']]);
  // Over the limit: still answer, but don't count this tab again.
  const counting = Number(count) <= PINGS_PER_MINUTE;
  const [, , here, , , today, hearts, heartAt] = await redis([
    counting ? ['ZADD', 'kyb:here', now, id] : ['PING'],
    ['ZREMRANGEBYSCORE', 'kyb:here', 0, now - HERE_WINDOW_MS],
    ['ZCARD', 'kyb:here'],
    counting ? ['PFADD', day, id] : ['PING'],
    ['EXPIRE', day, 172_800],
    ['PFCOUNT', day],
    ['GET', 'kyb:hearts'],
    ['GET', 'kyb:heart-at'],
  ]);
  return { here: Number(here) || 0, today: Number(today) || 0, hearts: Number(hearts) || 0, heartAt: Number(heartAt) || 0 };
}

/** One more heart, unless this address has hearted five times in the last hour. */
export async function heart(redis: Redis, ip: string, now = Date.now()): Promise<{ counted: boolean; hearts: number; heartAt: number }> {
  const rate = `kyb:heart:${ip}`;
  const [count] = await redis([['INCR', rate], ['EXPIRE', rate, 3_600, 'NX']]);
  if (Number(count) > HEARTS_PER_HOUR) {
    const [hearts, heartAt] = await redis([['GET', 'kyb:hearts'], ['GET', 'kyb:heart-at']]);
    return { counted: false, hearts: Number(hearts) || 0, heartAt: Number(heartAt) || 0 };
  }
  const [hearts] = await redis([['INCR', 'kyb:hearts'], ['SET', 'kyb:heart-at', now]]);
  return { counted: true, hearts: Number(hearts) || 0, heartAt: now };
}

export interface Req { method?: string; query?: Record<string, string | string[] | undefined>; headers: Record<string, string | string[] | undefined> }
export interface Res { status(code: number): Res; json(body: unknown): void; setHeader(name: string, value: string): void }

const ORIGIN = /^https:\/\/govbot-know-your-ballot(-[a-z0-9-]+)?\.vercel\.app$|^https?:\/\/localhost(:\d+)?$/i;
/** A browser on another website can't spend this site's quota: an Origin header, when sent, must be ours. */
export const ourOrigin = (req: Req) => { const o = String(req.headers.origin ?? ''); return !o || ORIGIN.test(o) || o === process.env.KYB_ORIGIN; };
export const clientIp = (req: Req) => (String(req.headers['x-forwarded-for'] ?? '').split(',')[0] || 'unknown').trim();
