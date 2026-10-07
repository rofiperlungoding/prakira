// Verifier: model output is untrusted. A claim survives only if every fact id exists, all cited facts
// belong to one hazard, the stated level equals the deterministic level of the first fact, that fact is
// serious for this household (when thresholds are given), every number in the evidence matches a cited
// fact value, and the advice contains no digits (so it cannot smuggle in unverified numbers or times).
import { isSerious } from './facts.mjs';

export const PROFILES = ['older_adult', 'young_child', 'outdoor_worker', 'respiratory_condition', 'pregnant', 'flood_prone_home', 'no_air_conditioning'];

// Levels at which "stay indoors" advice is proportionate. Below them it is over-warning.
const STAY_IN_OK = new Set(['danger', 'extreme danger', 'unhealthy', 'very unhealthy', 'hazardous', 'extreme']);
// ponytail: keyword heuristic for English and Indonesian only; replace with a classifier if more languages are added.
const STAY_IN = /\b(indoors?|inside)\b|di dalam (rumah|ruangan)|dalam rumah/i;

const NUM = /\d+(?:\.\d+)?/g;

function matches(n, value) {
  const dec = (n.split('.')[1] ?? '').length;
  return Math.abs(Number(n) - value) <= 0.5 * 10 ** -dec + 1e-9;
}

export function verifyClaim(c, facts, th) {
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
  if (cited.some((f) => f.hazard !== primary.hazard)) return { ok: false, reason: 'cites more than one hazard' };
  if (th && !isSerious(primary, th)) return { ok: false, reason: 'first fact is not a serious hazard for this household' };
  if (/\d/.test(c.advice)) return { ok: false, reason: 'advice contains a number' };
  if (STAY_IN.test(c.advice) && !STAY_IN_OK.has(primary.level)) return { ok: false, reason: `stay-indoors advice at level "${primary.level}"` };
  if (c.level.toLowerCase() !== primary.level) {
    return { ok: false, reason: `level "${c.level}" != "${primary.level}"` };
  }
  // Drop the "PM2.5" label and read a decimal comma (Indonesian format) as a decimal point.
  const text = c.evidence.replace(/PM ?2[.,]5/gi, 'PM').replace(/(\d),(\d)/g, '$1.$2');
  for (const n of text.match(NUM) ?? []) {
    if (!cited.some((f) => matches(n, f.value))) return { ok: false, reason: `number ${n} not in cited facts` };
  }
  return { ok: true };
}

export function verifyAll(parsed, facts, th) {
  const raw = Array.isArray(parsed?.claims) ? parsed.claims : [];
  const verified = [];
  const rejected = [];
  for (const c of raw) {
    const v = verifyClaim(c, facts, th);
    if (v.ok) verified.push(c);
    else rejected.push({ claim: c, reason: v.reason });
  }
  return { verified, rejected, total: raw.length };
}
