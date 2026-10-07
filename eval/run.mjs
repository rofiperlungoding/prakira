// Groundedness eval over fixed locations. Live APIs, so results vary by day; the report records the date.
// Usage: node eval/run.mjs [count] [en|id] [tuned|heldout]
// Metrics:
//  - raw pass rate: share of the model's actions that are kept (not rejected for digits, disproportionate
//    "stay indoors" advice, a hazard that is not serious for the household, or a duplicate)
//  - coverage: share of serious facts (per-hazard, per-household thresholds) cited by a verified model claim;
//    standard notices fill the rest, so coverage with notices is 100% by construction
//  - readability (English only): Flesch-Kincaid grade of each kept action (the only text the model writes)
// The model writes no numbers, so there is no number check to measure here; the unit tests cover the rules.
import fs from 'node:fs';
import { makeBrief } from '../lib/brief.mjs';
import { thresholds, isSerious } from '../lib/facts.mjs';
import { fleschKincaid } from '../lib/readability.mjs';
import { SETS, PROFILES } from './places.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const set = SETS[process.argv[4]] ? process.argv[4] : 'tuned';
const PLACES = SETS[set];
const limit = Number(process.argv[2]) || PLACES.length;
const lang = process.argv[3] === 'id' ? 'id' : 'en';

const rows = [];
for (const [i, [name, lat, lon]] of PLACES.slice(0, limit).entries()) {
  const profile = PROFILES[i % PROFILES.length];
  let b;
  try {
    b = await makeBrief({ lat, lon, profile, lang, climate: false });
  } catch (e) {
    rows.push({ name, error: e.message });
    console.log(name, 'ERROR', e.message);
    continue;
  }
  const th = thresholds(profile);
  const hi = b.facts.filter((f) => isSerious(f, th));
  const covered = hi.filter((f) => b.claims.some((c) => c.fact_ids.includes(f.id)));
  const grades = lang === 'en' ? b.claims.map((c) => fleschKincaid(c.advice)).filter((g) => g != null) : [];
  const row = { name, profile, attempts: b.attempts, error: b.error, total: b.total, verified: b.claims.length, rejected: b.rejected.map((r) => r.reason), quiet: b.quiet, hiFacts: hi.length, hiCovered: covered.length, notices: b.notices.length, noticeFacts: b.notices.reduce((n, x) => n + x.fact_ids.length, 0), grades, claims: b.claims.map((c) => ({ advice: c.advice, evidence: c.evidence, level: c.level })) };
  rows.push(row);
  console.log(name.padEnd(16), `verified ${row.verified}/${row.total}`, `model coverage ${row.hiCovered}/${row.hiFacts} (+${row.notices} notices)`, b.quiet ? '(quiet: no model call)' : '', row.error ?? '');
  await sleep(1500);
}

const ok = rows.filter((r) => !r.error);
const sum = (k) => ok.reduce((s, r) => s + r[k], 0);
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : 'n/a');
const grades = ok.flatMap((r) => r.grades).sort((a, b) => a - b);
const reasons = {};
for (const r of ok) for (const x of r.rejected) { const k = x.replace(/\d+(\.\d+)?/g, 'N'); reasons[k] = (reasons[k] ?? 0) + 1; }
const summary = {
  date: new Date().toISOString(), set, lang, locations: rows.length, failedLocations: rows.length - ok.length, quietLocations: ok.filter((r) => r.quiet).length,
  rawPassRate: pct(sum('verified'), sum('total')), claimsTotal: sum('total'), claimsVerified: sum('verified'),
  seriousFacts: sum('hiFacts'), coveredByModel: pct(sum('hiCovered'), sum('hiFacts')), coveredWithNotices: pct(sum('hiCovered') + sum('noticeFacts'), sum('hiFacts')),
  readability: grades.length ? { claims: grades.length, medianGrade: Number(grades[Math.floor(grades.length / 2)].toFixed(1)), atOrBelowGrade8: pct(grades.filter((g) => g <= 8).length, grades.length) } : 'not computed (English only)',
  rejectionReasons: reasons,
};
console.log('\n', summary);
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const stamp = summary.date.replace(/[:.]/g, '-');
fs.writeFileSync(new URL(`./out/report-${set}-${lang}-${stamp}.json`, import.meta.url), JSON.stringify({ summary, rows }, null, 1));
