// Small in-memory guards for a public deployment on a free-tier model key.
// ponytail: per-process memory only; state is lost on restart and not shared between instances. Use a shared
// store if this ever runs on more than one process.

// Fixed-window rate limiter. allow(key) returns 0 when allowed, or the seconds to wait when not.
export function rateLimiter(max, windowMs, now = Date.now) {
  const hits = new Map();
  return (key) => {
    const t = now();
    let e = hits.get(key);
    if (!e || t - e.start >= windowMs) {
      if (hits.size > 5000) hits.clear(); // bound memory under a flood of distinct addresses
      e = { start: t, n: 0 };
      hits.set(key, e);
    }
    if (e.n >= max) return Math.ceil((e.start + windowMs - t) / 1000);
    e.n++;
    return 0;
  };
}

// Cache with a time-to-live and a size cap (oldest entry dropped first).
export function ttlCache(ttlMs, maxEntries, now = Date.now) {
  const m = new Map();
  return {
    get(key) {
      const e = m.get(key);
      if (!e) return undefined;
      if (now() - e.t >= ttlMs) { m.delete(key); return undefined; }
      return e.v;
    },
    set(key, v) {
      if (m.size >= maxEntries && !m.has(key)) m.delete(m.keys().next().value);
      m.set(key, { t: now(), v });
    },
  };
}
