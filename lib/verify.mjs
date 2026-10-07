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

export function verifyClaim(c, facts, th, strict = false) {
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
  const nums = text.match(NUM) ?? [];
  for (const n of nums) {
    if (!cited.some((f) => matches(n, f.value))) return { ok: false, reason: `number ${n} not in cited facts` };
  }
  // Model claims only: every cited day must have its value stated. Otherwise a claim could cite three days,
  // count as covering them, and say "the same today and tomorrow" when the values differ.
  if (strict) {
    const silent = cited.find((f) => f.level !== 'n/a' && !nums.some((n) => matches(n, f.value)));
    if (silent) return { ok: false, reason: 'a cited value is not stated in the evidence' };
    // Each number must belong to the day it is written next to. Without this, "224 today, 219 tomorrow"
    // passed when the data said 219 today and 224 the day after: right numbers, wrong days.
    for (const sentence of text.split(/(?<=[.!?;])\s+/)) {
      const days = dayMentions(sentence, cited);
      for (const m of sentence.matchAll(NUM)) {
        if (!days.length) return { ok: false, reason: `number ${m[0]} is not tied to a day` };
        const near = days.reduce((a, b) => (Math.abs(b.pos - m.index) < Math.abs(a.pos - m.index) ? b : a));
        if (!cited.some((f) => f.day === near.day && matches(m[0], f.value))) return { ok: false, reason: `number ${m[0]} is written for the wrong day` };
      }
    }
  }
  return { ok: true };
}

// Day words in English and Indonesian, longest first so "the day after tomorrow" is not read as "tomorrow".
const DAY_WORDS = [['the day after tomorrow', 'the day after tomorrow'], ['lusa', 'the day after tomorrow'], ['tomorrow', 'tomorrow'], ['besok', 'tomorrow'], ['today', 'today'], ['hari ini', 'today']];
const WEEKDAY_WORDS = { Sunday: ['sunday', 'minggu'], Monday: ['monday', 'senin'], Tuesday: ['tuesday', 'selasa'], Wednesday: ['wednesday', 'rabu'], Thursday: ['thursday', 'kamis'], Friday: ['friday', 'jumat'], Saturday: ['saturday', 'sabtu'] };

// Where each day is named in a sentence: [{ pos, day }], with day as in the facts ("today", "tomorrow", ...).
// A weekday name counts as the day of the cited fact that falls on that weekday.
// ponytail: nearest-day-word heuristic for the sentence shape the prompt asks for (one short sentence per day).
// A sentence that lists several days and then several numbers is rejected, which is the safe direction.
function dayMentions(sentence, cited) {
  const s = sentence.toLowerCase();
  const found = [];
  const taken = [];
  const add = (word, day) => {
    for (let i = s.indexOf(word); i >= 0; i = s.indexOf(word, i + 1)) {
      if (taken.some(([a, b]) => i >= a && i < b)) continue;
      taken.push([i, i + word.length]);
      found.push({ pos: i, day });
    }
  };
  for (const [word, day] of DAY_WORDS) add(word, day);
  for (const f of cited) for (const word of WEEKDAY_WORDS[f.weekday] ?? []) add(word, f.day);
  return found;
}

export function verifyAll(parsed, facts, th) {
  const raw = Array.isArray(parsed?.claims) ? parsed.claims : [];
  const verified = [];
  const rejected = [];
  for (const c of raw) {
    const v = verifyClaim(c, facts, th, true);
    if (v.ok) verified.push(c);
    else rejected.push({ claim: c, reason: v.reason });
  }
  return { verified, rejected, total: raw.length };
}
