// POST /api/heart — one more heart for the site; returns { counted, hearts, heartAt }.
// See api/_pulse.ts.
import { addressKey, clientIp, connect, heart, ourOrigin, type Req, type Res } from './_pulse';

export default async function handler(req: Req, res: Res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const store = connect();
  if (!store) return res.status(503).json({ error: 'Not set up on this copy of the site.' });
  if (!ourOrigin(req)) return res.status(400).json({ error: 'Bad request' });
  try { return res.status(200).json(await heart(store.redis, addressKey(clientIp(req), store.secret))); }
  catch { return res.status(502).json({ error: 'Try again shortly.' }); }
}
