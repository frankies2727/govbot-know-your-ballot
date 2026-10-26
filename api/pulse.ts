// GET /api/pulse?id=<random tab id> — counts this tab as using the guide right
// now and returns { here, today, hearts, heartAt }. See api/_pulse.ts.
import { addressKey, clientIp, connect, ourOrigin, ping, type Req, type Res } from './_pulse.js';

const ID = /^[a-z0-9-]{8,40}$/i;

export default async function handler(req: Req, res: Res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const store = connect();
  if (!store) return res.status(503).json({ error: 'Not set up on this copy of the site.' });
  const id = String(req.query?.id ?? '');
  if (!ID.test(id) || !ourOrigin(req)) return res.status(400).json({ error: 'Bad request' });
  try { return res.status(200).json(await ping(store.redis, id, addressKey(clientIp(req), store.secret))); }
  catch { return res.status(502).json({ error: 'Try again shortly.' }); }
}
