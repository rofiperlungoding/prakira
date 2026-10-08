// The model writes only the action for each serious hazard. It never writes a number, a level or the
// evidence sentence: those are built here from the facts. Model output is still untrusted, so each action
// is checked before it is shown.
import { isSerious } from './facts.mjs';
import { evidenceFor } from './notice.mjs';
import { COMMON, STEP } from './vocab.mjs';

export const PROFILES = ['older_adult', 'young_child', 'outdoor_worker', 'respiratory_condition', 'pregnant', 'flood_prone_home', 'no_air_conditioning'];

// Levels at which "stay indoors" advice is proportionate. Below them it is over-warning.
const STAY_IN_OK = new Set(['danger', 'extreme danger', 'unhealthy', 'very unhealthy', 'hazardous', 'extreme']);
// ponytail: keyword heuristic for English and Indonesian only; replace with a classifier if more languages are added.
const STAY_IN = /\b(indoors?|inside)\b|di dalam (rumah|ruangan)|dalam rumah/i;
const MAX_ADVICE = 240;

const NUM = /\d+(?:\.\d+)?/g;

function matches(n, value) {
  const dec = (n.split('.')[1] ?? '').length;
  return Math.abs(Number(n) - value) <= 0.5 * 10 ** -dec + 1e-9;
}

// Does the action belong to its hazard, and is it made only of reviewed words (lib/vocab.mjs)? A rejected
// action is replaced by the standard notice for the hazard, so being strict here costs wording, never coverage.
export function topicProblem(advice, hazard, lang = 'en') {
  const l = STEP[lang] ? lang : 'en';
  const step = STEP[l][hazard];
  if (!step) return null;
  const tokens = advice.toLowerCase().replace(/['’]s\b/g, '').match(/\p{L}+/gu) ?? [];
  const unknown = tokens.find((w) => !step.has(w) && !COMMON[l].has(w));
  if (unknown) return `word outside the reviewed list: "${unknown}"`;
  if (!tokens.some((w) => step.has(w))) return 'action does not name a step for this hazard';
  return null;
}

// Why an action may not be shown, or null when it may. `level` is the rule-based level of the hazard.
export function adviceProblem(advice, level) {
  if (typeof advice !== 'string' || !advice.trim()) return 'missing advice';
  if (advice.length > MAX_ADVICE) return 'advice is too long';
  if (/\d/.test(advice)) return 'advice contains a number';
  if (advice.includes('_')) return 'advice contains an internal label'; // e.g. "young_child" copied from the prompt
  if (STAY_IN.test(advice) && !STAY_IN_OK.has(level)) return `stay-indoors advice at level "${level}"`;
  return null;
}

// Consistency check for a finished item (a built claim or a standard notice): its ids exist and share one
// hazard, its level is the rule-based level, and every number in its evidence is a cited value. Built items
// should always pass; a failure here means a bug in the templates, not a model error.
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
  const problem = adviceProblem(c.advice, primary.level);
  if (problem) return { ok: false, reason: problem };
  if (c.level.toLowerCase() !== primary.level) return { ok: false, reason: `level "${c.level}" != "${primary.level}"` };
  // Drop the "PM2.5" label and read a decimal comma (Indonesian format) as a decimal point.
  const text = c.evidence.replace(/PM ?2[.,]5/gi, 'PM').replace(/(\d),(\d)/g, '$1.$2');
  for (const n of text.match(NUM) ?? []) {
    if (!cited.some((f) => matches(n, f.value))) return { ok: false, reason: `number ${n} not in cited facts` };
  }
  return { ok: true };
}

// Turns the model's answer, {"claims":[{"hazard":"heat","advice":"..."}]}, into items that can be shown.
// For each hazard that is serious for the household, the first acceptable action is kept; its facts, level
// and evidence sentence come from the data. Everything else is rejected with a reason.
export function verifyAll(parsed, facts, th, lang = 'en') {
  const raw = Array.isArray(parsed?.claims) ? parsed.claims : [];
  const serious = facts.filter((f) => isSerious(f, th));
  const verified = [];
  const rejected = [];
  const done = new Set();
  for (const c of raw) {
    const reject = (reason) => rejected.push({ claim: { hazard: c?.hazard, advice: c?.advice }, reason });
    if (!c || typeof c !== 'object') { reject('not an object'); continue; }
    // Most severe day first: its level is the level of the item.
    const group = serious.filter((f) => f.hazard === c.hazard).sort((a, b) => b.severity - a.severity || b.value - a.value);
    if (!group.length) { reject('not a serious hazard for this household'); continue; }
    if (done.has(c.hazard)) { reject('second action for the same hazard'); continue; }
    const problem = adviceProblem(c.advice, group[0].level) ?? topicProblem(c.advice, c.hazard, lang);
    if (problem) { reject(problem); continue; }
    const item = { hazard: c.hazard, fact_ids: group.map((f) => f.id), level: group[0].level, evidence: evidenceFor(group, lang), advice: c.advice.trim() };
    const check = verifyClaim(item, facts, th);
    if (!check.ok) { reject(`internal check failed: ${check.reason}`); continue; }
    done.add(c.hazard);
    verified.push(item);
  }
  return { verified, rejected, total: raw.length };
}
