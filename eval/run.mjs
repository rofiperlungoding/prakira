// Groundedness eval over fixed locations. Live APIs, so results vary by day; the report records the date.
// Usage: node eval/run.mjs [count] [en|id] [tuned|heldout]
// Metrics:
//  - raw pass rate: share of model claims that pass verification (how often the model is wrong)
//  - coverage: share of serious facts (per-hazard, per-household thresholds) cited by a verified model claim;
//    standard notices fill the rest, so coverage with notices is 100% by construction
//  - verifier catch rate: corrupted copies of verified claims (wrong number, wrong level) that get rejected
//  - readability (English only): Flesch-Kincaid grade of each verified claim (action plus evidence)
import fs from 'node:fs';
import { makeBrief } from '../lib/brief.mjs';
import { verifyClaim } from '../lib/verify.mjs';
import { thresholds, isSerious } from '../lib/facts.mjs';
import { fleschKincaid } from '../lib/readability.mjs';

const SETS = {
  // The prompt and the verifier were tuned while looking at results from these 20 places.
  tuned: [
    ['Jakarta', -6.2, 106.8], ['Surabaya', -7.25, 112.75], ['Bandung', -6.92, 107.61], ['Medan', 3.59, 98.67], ['Makassar', -5.15, 119.43],
    ['Delhi', 28.61, 77.21], ['Dhaka', 23.81, 90.41], ['Bangkok', 13.76, 100.5], ['Manila', 14.6, 120.98], ['Lagos', 6.52, 3.38],
    ['Cairo', 30.04, 31.24], ['Dubai', 25.2, 55.27], ['Phoenix', 33.45, -112.07], ['Houston', 29.76, -95.37], ['Sao Paulo', -23.55, -46.63],
    ['London', 51.51, -0.13], ['Madrid', 40.42, -3.7], ['Beijing', 39.9, 116.4], ['Sydney', -33.87, 151.21], ['Nairobi', -1.29, 36.82],
  ],
  // Never used while tuning. Do not change the prompt or the verifier in response to results from this set.
  heldout: [
    ['Karachi', 24.86, 67.01], ['Mumbai', 19.08, 72.88], ['Ho Chi Minh City', 10.82, 106.63], ['Kuala Lumpur', 3.14, 101.69], ['Riyadh', 24.71, 46.68],
    ['Mexico City', 19.43, -99.13], ['Johannesburg', -26.2, 28.05], ['Tokyo', 35.68, 139.69], ['Paris', 48.86, 2.35], ['Toronto', 43.65, -79.38],
    ['Semarang', -6.97, 110.42], ['Chennai', 13.08, 80.27], ['Accra', 5.6, -0.19], ['Lima', -12.05, -77.04], ['Las Vegas', 36.17, -115.14],
  ],
};
const PROFILES = [[], ['older_adult', 'no_air_conditioning'], ['outdoor_worker'], ['young_child', 'respiratory_condition']];
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
    b = await makeBrief({ lat, lon, profile, lang });
  } catch (e) {
    rows.push({ name, error: e.message });
    console.log(name, 'ERROR', e.message);
    continue;
  }
  const th = thresholds(profile);
  const hi = b.facts.filter((f) => isSerious(f, th));
  const covered = hi.filter((f) => b.claims.some((c) => c.fact_ids.includes(f.id)));
  let corrupt = 0, caught = 0;
  for (const c of b.claims) {
    const bad = [{ ...c, level: 'danger-zz' }];
    // Only corrupt a number when one exists, and only when +7 is not another cited value.
    const m = c.evidence.match(/\d+(?:\.\d+)?/);
    if (m) bad.push({ ...c, evidence: c.evidence.replace(m[0], String(Number(m[0]) + 7.37)) });
    for (const x of bad) { corrupt++; if (!verifyClaim(x, b.facts, th).ok) caught++; }
  }
  const grades = lang === 'en' ? b.claims.map((c) => fleschKincaid(`${c.advice} ${c.evidence}`)).filter((g) => g != null) : [];
  const row = { name, profile, attempts: b.attempts, error: b.error, total: b.total, verified: b.claims.length, rejected: b.rejected.map((r) => r.reason), quiet: b.quiet, hiFacts: hi.length, hiCovered: covered.length, notices: b.notices.length, noticeFacts: b.notices.reduce((n, x) => n + x.fact_ids.length, 0), corrupt, caught, grades, claims: b.claims.map((c) => ({ advice: c.advice, evidence: c.evidence, level: c.level })) };
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
  seriousFacts: sum('hiFacts'), coveredByModel: pct(sum('hiCovered'), sum('hiFacts')), coveredWithNotices: pct(sum('hiCovered') + sum('noticeFacts'), sum('hiFacts')), verifierCatchRate: pct(sum('caught'), sum('corrupt')),
  readability: grades.length ? { claims: grades.length, medianGrade: Number(grades[Math.floor(grades.length / 2)].toFixed(1)), atOrBelowGrade8: pct(grades.filter((g) => g <= 8).length, grades.length) } : 'not computed (English only)',
  rejectionReasons: reasons,
};
console.log('\n', summary);
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const stamp = summary.date.replace(/[:.]/g, '-');
fs.writeFileSync(new URL(`./out/report-${set}-${lang}-${stamp}.json`, import.meta.url), JSON.stringify({ summary, rows }, null, 1));
