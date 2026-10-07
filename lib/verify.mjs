// Verifier: model output is untrusted. A claim survives only if every fact id exists,
// the stated level equals the deterministic level, and every number in the evidence
// text matches a cited fact value.

export const PROFILES = ['older_adult', 'young_child', 'outdoor_worker', 'respiratory_condition', 'pregnant', 'flood_prone_home', 'no_air_conditioning'];

const NUM = /\d+(?:\.\d+)?/g;

function matches(n, value) {
  const dec = (n.split('.')[1] ?? '').length;
  return Math.abs(Number(n) - value) <= 0.5 * 10 ** -dec + 1e-9;
}

export function verifyClaim(c, facts) {
  if (!c || typeof c !== 'object') return { ok: false, reason: 'not an object' };
  for (const k of ['evidence', 'advice', 'level']) {
    if (typeof c[k] !== 'string' || !c[k].trim()) return { ok: false, reason: `missing ${k}` };
  }
  if (!Array.isArray(c.fact_ids) || !c.fact_ids.length || !c.fact_ids.every((x) => typeof x === 'string')) {
    return { ok: false, reason: 'missing fact_ids' };
  }
  const byId = new Map(facts.map((f) => [f.id, f]));
  const cited = c.fact_ids.map((id) => byId.get(id));
  if (cited.some((f) => !f)) return { ok: false, reason: 'unknown fact id' };
  const primary = cited[0];
  if (c.level.toLowerCase() !== primary.level) {
    return { ok: false, reason: `level "${c.level}" != "${primary.level}"` };
  }
  for (const n of c.evidence.replace(/PM ?2\.5/gi, 'PM').match(NUM) ?? []) {
    if (!cited.some((f) => matches(n, f.value))) return { ok: false, reason: `number ${n} not in cited facts` };
  }
  return { ok: true };
}

export function verifyAll(parsed, facts) {
  const raw = Array.isArray(parsed?.claims) ? parsed.claims : [];
  const verified = [];
  const rejected = [];
  for (const c of raw) {
    const v = verifyClaim(c, facts);
    if (v.ok) verified.push(c);
    else rejected.push({ claim: c, reason: v.reason });
  }
  return { verified, rejected, total: raw.length };
}
