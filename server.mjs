import http from 'node:http';
import fs from 'node:fs';
import { geocode } from './lib/facts.mjs';
import { makeBrief, cleanProfile } from './lib/brief.mjs';
import { rateLimiter, ttlCache } from './lib/limits.mjs';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const page = fs.readFileSync(new URL('./public/index.html', import.meta.url));

// ponytail: 'unsafe-inline' because the page is one file with inline script and style. Model text is only ever
// inserted with textContent. Split the page into files and drop 'unsafe-inline' if it grows.
const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

const briefLimit = rateLimiter(10, 10 * 60_000); // each briefing can cost a model call
const geoLimit = rateLimiter(120, 10 * 60_000);
const briefCache = ttlCache(10 * 60_000, 200);

const send = (res, code, body, type = 'application/json', extra = {}) => {
  res.writeHead(code, { 'content-type': type, ...SECURITY, ...extra });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

const readBody = (req) => new Promise((ok, no) => {
  let s = '';
  req.on('data', (c) => {
    s += c;
    if (s.length > 10_000) { no(new Error('request too large')); req.destroy(); }
  });
  req.on('end', () => ok(s));
});

// Behind the Cloudflare Tunnel the socket address is always local, so the client address comes from the header
// Cloudflare sets. The server binds to localhost, so only the tunnel can reach it and set that header.
const client = (req) => req.headers['cf-connecting-ip'] || req.socket.remoteAddress || 'unknown';
const limited = (res, wait) => send(res, 429, { error: `Too many requests. Try again in ${wait} s.` }, 'application/json', { 'retry-after': String(wait) });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/') return send(res, 200, page, 'text/html; charset=utf-8', { 'cache-control': 'no-cache' });
    if (u.pathname === '/healthz') return send(res, 200, { ok: true });
    if (u.pathname === '/api/geocode') {
      const wait = geoLimit(client(req));
      if (wait) return limited(res, wait);
      const q = (u.searchParams.get('q') ?? '').slice(0, 80);
      return send(res, 200, q.length < 2 ? [] : await geocode(q));
    }
    if (u.pathname === '/api/brief' && req.method === 'POST') {
      let b;
      try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'invalid request body' }); }
      const lat = Number(b?.lat);
      const lon = Number(b?.lon);
      if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return send(res, 400, { error: 'invalid coordinates' });
      const profile = cleanProfile(b.profile).sort();
      const lang = b.lang === 'id' ? 'id' : 'en';
      const key = `${lat.toFixed(2)},${lon.toFixed(2)}|${profile.join(',')}|${lang}`;
      const hit = briefCache.get(key);
      if (hit) return send(res, 200, hit);
      const wait = briefLimit(client(req));
      if (wait) return limited(res, wait);
      const out = await makeBrief({ lat, lon, profile, lang });
      if (!out.error) briefCache.set(key, out); // do not keep a failed model call for 10 minutes
      return send(res, 200, out);
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(new Date().toISOString(), u.pathname, e.message);
    send(res, 502, { error: e.message });
  }
}).listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
