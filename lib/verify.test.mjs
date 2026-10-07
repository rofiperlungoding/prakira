import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyClaim, verifyAll } from './verify.mjs';
import { level, buildFacts } from './facts.mjs';

const facts = [
  { id: 'heat-0', level: 'extreme caution', value: 40.5 },
  { id: 'aqi-0', level: 'moderate', value: 87 },
  { id: 'pm25-0', level: 'n/a', value: 30.2 },
];
const good = { fact_ids: ['heat-0'], level: 'extreme caution', evidence: 'Peak apparent temperature is 40.5 °C today.', advice: 'Stay indoors at noon.' };

test('accepts a grounded claim', () => assert.equal(verifyClaim(good, facts).ok, true));
test('accepts integer rounding', () => assert.equal(verifyClaim({ ...good, evidence: 'About 41 °C.' }, facts).ok, true));
test('rejects far-off rounding', () => assert.equal(verifyClaim({ ...good, evidence: 'About 38 °C.' }, facts).ok, false));
test('rejects fabricated number', () => assert.match(verifyClaim({ ...good, evidence: 'It reaches 44.1 °C.' }, facts).reason, /not in cited/));
test('rejects wrong level', () => assert.match(verifyClaim({ ...good, level: 'danger' }, facts).reason, /level/));
test('rejects unknown fact id', () => assert.match(verifyClaim({ ...good, fact_ids: ['nope-9'] }, facts).reason, /unknown/));
test('rejects number from an uncited fact', () => assert.equal(verifyClaim({ ...good, evidence: 'AQI is 87.' }, facts).ok, false));
test('rejects missing fields and garbage', () => {
  assert.equal(verifyClaim(null, facts).ok, false);
  assert.equal(verifyClaim({ ...good, advice: '' }, facts).ok, false);
  assert.equal(verifyClaim({ ...good, fact_ids: [] }, facts).ok, false);
});
test('verifyAll splits and tolerates non-array', () => {
  const r = verifyAll({ claims: [good, { ...good, evidence: '99 °C' }] }, facts);
  assert.deepEqual([r.verified.length, r.rejected.length, r.total], [1, 1, 2]);
  assert.equal(verifyAll({ claims: 'x' }, facts).total, 0);
});

test('hazard bands', () => {
  assert.equal(level('heat', 40.5).level, 'extreme caution');
  assert.equal(level('heat', 41).level, 'extreme caution');
  assert.equal(level('rain', 50).level, 'moderate');
  assert.equal(level('aqi', 151).level, 'unhealthy');
  assert.equal(level('uv', 9.05).level, 'very high');
});

test('buildFacts shapes data and skips missing', () => {
  const fc = { daily: { time: ['2026-10-07'], apparent_temperature_max: [40.5], precipitation_sum: [null], precipitation_probability_max: [78], uv_index_max: [9.05] } };
  const aq = { hourly: { time: ['2026-10-07T00:00', '2026-10-07T01:00'], us_aqi: [60, 87], pm2_5: [20, 30.2] } };
  const f = buildFacts(fc, aq);
  assert.deepEqual(f.map((x) => x.id), ['heat-0', 'rainprob-0', 'aqi-0', 'pm25-0', 'uv-0']);
  assert.equal(f.find((x) => x.id === 'aqi-0').value, 87);
  assert.equal(f[0].weekday, 'Wednesday');
});

test('PM2.5 label is not treated as a number', () => {
  const f = [{ id: 'aqi-0', level: 'unhealthy', value: 155 }, { id: 'pm25-0', level: 'n/a', value: 71.7 }];
  const c = { fact_ids: ['aqi-0', 'pm25-0'], level: 'unhealthy', evidence: 'US AQI peaks at 155 and PM2.5 at 71.7 µg/m³.', advice: 'Wear an N95 mask.' };
  assert.equal(verifyClaim(c, f).ok, true);
  assert.equal(verifyClaim({ ...c, evidence: 'PM2.5 at 99 µg/m³.' }, f).ok, false);
});
