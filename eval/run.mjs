// Groundedness eval over fixed locations. Live APIs, so results vary by day; the report records the date.
// Metrics:
//  - raw pass rate: share of model claims that pass verification (how often the model is wrong)
//  - coverage: share of serious facts (per-hazard thresholds) that a verified model claim cites first;
//    standard notices fill the rest, so coverage with notices is 100% by construction
//  - verifier catch rate: corrupted copies of verified claims (wrong number, wrong level) that get rejected
import fs from 'node:fs';
import { makeBrief } from '../lib/brief.mjs';
import { verifyClaim } from '../lib/verify.mjs';
import { isSerious } from '../lib/notice.mjs';

const PLACES = [
  ['Jakarta', -6.2, 106.8], ['Surabaya', -7.25, 112.75], ['Bandung', -6.92, 107.61], ['Medan', 3.59, 98.67], ['Makassar', -5.15, 119.43],
  ['Delhi', 28.61, 77.21], ['Dhaka', 23.81, 90.41], ['Bangkok', 13.76, 100.5], ['Manila', 14.6, 120.98], ['Lagos', 6.52, 3.38],
  ['Cairo', 30.04, 31.24], ['Dubai', 25.2, 55.27], ['Phoenix', 33.45, -112.07], ['Houston', 29.76, -95.37], ['Sao Paulo', -23.55, -46.63],
  ['London', 51.51, -0.13], ['Madrid', 40.42, -3.7], ['Beijing', 39.9, 116.4], ['Sydney', -33.87, 151.21], ['Nairobi', -1.29, 36.82],
];
const PROFILES = [[], ['older_adult', 'no_air_conditioning'], ['outdoor_worker'], ['young_child', 'respiratory_condition']];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  const hi = b.facts.filter(isSerious);
  const covered = hi.filter((f) => b.claims.some((c) => c.fact_ids[0] === f.id));
  let corrupt = 0, caught = 0;
  for (const c of b.claims) {
    const bad = [{ ...c, level: 'danger-zz' }];
    // Only corrupt a number when one exists, and only when +7 is not another cited value.
    const m = c.evidence.match(/\d+(?:\.\d+)?/);
    if (m) bad.push({ ...c, evidence: c.evidence.replace(m[0], String(Number(m[0]) + 7.37)) });
    for (const x of bad) { corrupt++; if (!verifyClaim(x, b.facts).ok) caught++; }
  }
  const row = { name, profile, attempts: b.attempts, error: b.error, total: b.total, verified: b.claims.length, rejected: b.rejected.map((r) => r.reason), hiFacts: hi.length, hiCovered: covered.length, notices: b.notices.length, corrupt, caught };
  rows.push(row);
  console.log(name.padEnd(10), `verified ${row.verified}/${row.total}`, `model coverage ${row.hiCovered}/${row.hiFacts} (+${row.notices} notices)`, row.error ?? '');
  await sleep(1500);
}

const ok = rows.filter((r) => !r.error);
const sum = (k) => ok.reduce((s, r) => s + r[k], 0);
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : 'n/a');
const summary = {
  date: new Date().toISOString(), locations: rows.length, failedLocations: rows.length - ok.length,
  rawPassRate: pct(sum('verified'), sum('total')), claimsTotal: sum('total'), claimsVerified: sum('verified'),
  lang, seriousFacts: sum('hiFacts'), coveredByModel: pct(sum('hiCovered'), sum('hiFacts')), coveredWithNotices: pct(sum('hiCovered') + sum('notices'), sum('hiFacts')), verifierCatchRate: pct(sum('caught'), sum('corrupt')),
};
console.log('\n', summary);
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./out/report.json', import.meta.url), JSON.stringify({ summary, rows }, null, 1));
