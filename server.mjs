import http from 'node:http';
import fs from 'node:fs';
import { geocode } from './lib/facts.mjs';
import { makeBrief, cleanProfile } from './lib/brief.mjs';

const PORT = process.env.PORT || 3000;
const page = fs.readFileSync(new URL('./public/index.html', import.meta.url));

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type });
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

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/') return send(res, 200, page, 'text/html; charset=utf-8');
    if (u.pathname === '/api/geocode') {
      const q = (u.searchParams.get('q') ?? '').slice(0, 80);
      return send(res, 200, q.length < 2 ? [] : await geocode(q));
    }
    if (u.pathname === '/api/brief' && req.method === 'POST') {
      const b = JSON.parse(await readBody(req));
      const lat = Number(b.lat);
      const lon = Number(b.lon);
      if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return send(res, 400, { error: 'invalid coordinates' });
      return send(res, 200, await makeBrief({ lat, lon, profile: cleanProfile(b.profile), lang: b.lang === 'id' ? 'id' : 'en' }));
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(e.message);
    send(res, 502, { error: e.message });
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
