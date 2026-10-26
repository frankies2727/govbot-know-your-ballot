// Offline test of api/_pulse.ts against an in-memory stand-in for Redis (the
// handful of commands it uses): node --experimental-strip-types scripts/pulse-test.mjs
import { addressKey, connect, heart, ourOrigin, ping } from '../api/_pulse.ts';

function fake() {
  const kv = new Map(), z = new Map(), hll = new Map();
  const run = (c) => {
    const [op, key, ...a] = c;
    switch (op) {
      case 'PING': return 'PONG';
      case 'INCR': kv.set(key, (Number(kv.get(key)) || 0) + 1); return kv.get(key);
      case 'EXPIRE': return 1;
      case 'GET': return kv.has(key) ? String(kv.get(key)) : null;
      case 'SET': kv.set(key, a[0]); return 'OK';
      case 'ZADD': (z.get(key) ?? z.set(key, new Map()).get(key)).set(a[1], Number(a[0])); return 1;
      case 'ZREMRANGEBYSCORE': for (const [m, s] of z.get(key) ?? []) if (s >= a[0] && s <= a[1]) z.get(key).delete(m); return 0;
      case 'ZCARD': return z.get(key)?.size ?? 0;
      case 'PFADD': (hll.get(key) ?? hll.set(key, new Set()).get(key)).add(a[0]); return 1;
      case 'PFCOUNT': return hll.get(key)?.size ?? 0;
      default: throw new Error(`fake redis: ${op}`);
    }
  };
  return async (cmds) => cmds.map(run);
}
const eq = (got, want, what) => { if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${what}: ${JSON.stringify(got)} !== ${JSON.stringify(want)}`); };

const redis = fake();
const t0 = Date.UTC(2026, 10, 1, 18, 0, 0);
// Three tabs from different addresses, one repeating.
let p = await ping(redis, 'tab-aaaaaaaa', 'ip1', t0);
p = await ping(redis, 'tab-bbbbbbbb', 'ip2', t0 + 1_000);
p = await ping(redis, 'tab-aaaaaaaa', 'ip1', t0 + 2_000);
p = await ping(redis, 'tab-cccccccc', 'ip3', t0 + 3_000);
eq([p.here, p.today], [3, 3], 'three tabs, one repeated');
// A minute later only the tab that pinged again is still here; today keeps all three.
p = await ping(redis, 'tab-cccccccc', 'ip3', t0 + 65_000);
eq([p.here, p.today], [1, 3], 'a tab that stopped pinging is gone after a minute');
// One address can't inflate the count: past 120 pings a minute, new ids are read but not counted.
for (let i = 0; i < 125; i++) await ping(redis, `bot-${String(i).padStart(8, '0')}`, 'ip-bot', t0 + 70_000);
p = await ping(redis, 'tab-dddddddd', 'ip4', t0 + 71_000);
if (p.here > 125) throw new Error(`one address inflated the count to ${p.here}`);
eq(p.here <= 122, true, 'flood is capped near the per-address limit');
// Hearts: counted, timestamped, and limited to 5 an hour per address.
let h = await heart(redis, 'ip5', t0);
eq([h.counted, h.hearts, h.heartAt], [true, 1, t0], 'first heart');
for (let i = 0; i < 4; i++) await heart(redis, 'ip5', t0 + 1_000);
h = await heart(redis, 'ip5', t0 + 2_000);
eq([h.counted, h.hearts], [false, 5], 'sixth heart from one address is not counted');
h = await heart(redis, 'ip6', t0 + 3_000);
eq([h.counted, h.hearts], [true, 6], 'another address still can');
p = await ping(redis, 'tab-eeeeeeee', 'ip7', t0 + 4_000);
eq([p.hearts, p.heartAt], [6, t0 + 3_000], 'pulse carries the heart total and when it last happened');
// Addresses become opaque keys; the same address gives the same key, a different secret a different one.
eq(addressKey('1.2.3.4', 's1') === addressKey('1.2.3.4', 's1') && addressKey('1.2.3.4', 's1') !== addressKey('1.2.3.4', 's2') && !addressKey('1.2.3.4', 's1').includes('1.2.3.4'), true, 'address key');
// The store is found under Vercel's default names, a custom prefix, or Upstash's own; absent → null.
eq(connect({}), null, 'no store');
eq(connect({ KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' }) !== null, true, 'default names');
eq(connect({ STORAGE_KV_REST_API_URL: 'https://x.upstash.io', STORAGE_KV_REST_API_TOKEN: 't' }) !== null, true, 'custom prefix');
eq(connect({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' }) !== null, true, 'upstash names');
eq(connect({ KV_REST_API_URL: 'http://insecure', KV_REST_API_TOKEN: 't' }), null, 'a non-https store is refused');
eq(connect({ REDIS_URL: 'rediss://default:pw@host:6379' }) !== null && connect({ STORAGE_REDIS_URL: 'redis://host:6379' }) !== null, true, 'Vercel Redis connection string, with or without a prefix');
eq(connect({ REDIS_URL: 'http://not-redis' }), null, 'a non-redis URL is refused');
// Only this site's own pages may call it.
const origin = (o) => ourOrigin({ headers: o ? { origin: o } : {} });
eq([origin(''), origin('https://govbot-know-your-ballot.vercel.app'), origin('http://localhost:5173'), origin('https://govbot-know-your-ballot-git-x-frankies2727.vercel.app'), origin('https://someone-elses-app.vercel.app'), origin('https://evil.example')], [true, true, true, true, false, false], 'origins');
console.log('pulse self-test ok');
