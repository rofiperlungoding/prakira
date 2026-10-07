import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyClaim, verifyAll } from './verify.mjs';

const facts = [
  { id: 'heat-0', level: 'extreme caution', value: 40.5 },
  { id: 'aqi-0', level: 'moderate', value: 87 },
  { id: 'pm25-0', level: 'n/a', value: 30.2 },
];
const good = { fact_ids: ['heat-0'], level: 'extreme caution', evidence: 'Peak apparent temperature is 40.5 °C today.', advice: 'Rest in the shade at midday.' };

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

test('PM2.5 label is not treated as a number', () => {
  const f = [{ id: 'aqi-0', level: 'unhealthy', value: 155 }, { id: 'pm25-0', level: 'n/a', value: 71.7 }];
  const c = { fact_ids: ['aqi-0', 'pm25-0'], level: 'unhealthy', evidence: 'US AQI peaks at 155 and PM2.5 at 71.7 µg/m³.', advice: 'Wear a well-fitting mask outside.' };
  assert.equal(verifyClaim(c, f).ok, true);
  assert.equal(verifyClaim({ ...c, evidence: 'PM2.5 at 99 µg/m³.' }, f).ok, false);
});

test('rejects advice with digits, mixed hazards, and non-serious first facts', () => {
  const f = [
    { id: 'heat-0', hazard: 'heat', level: 'danger', severity: 3, value: 43 },
    { id: 'heat-1', hazard: 'heat', level: 'caution', severity: 1, value: 30 },
    { id: 'aqi-0', hazard: 'air', level: 'unhealthy', severity: 3, value: 155 },
  ];
  const th = { heat: 2, air: 2 };
  const c = { fact_ids: ['heat-0', 'heat-1'], level: 'danger', evidence: 'Heat index 43 today and 30 tomorrow.', advice: 'Rest in the shade.' };
  assert.equal(verifyClaim(c, f, th).ok, true);
  assert.match(verifyClaim({ ...c, advice: 'Stay in from 11 to 4.' }, f, th).reason, /advice contains a number/);
  assert.match(verifyClaim({ ...c, fact_ids: ['heat-0', 'aqi-0'] }, f, th).reason, /more than one hazard/);
  assert.match(verifyClaim({ ...c, fact_ids: ['heat-1'], level: 'caution' }, f, th).reason, /not a serious hazard/);
  assert.equal(verifyClaim({ ...c, fact_ids: ['heat-1'], level: 'caution', evidence: 'Heat index 30.' }, f).ok, true); // no thresholds given
});

test('stay-indoors advice is rejected below the levels where it is proportionate', () => {
  const f = [{ id: 'heat-0', hazard: 'heat', level: 'extreme caution', severity: 2, value: 37 }, { id: 'aqi-0', hazard: 'air', level: 'unhealthy', severity: 3, value: 155 }];
  const heat = { fact_ids: ['heat-0'], level: 'extreme caution', evidence: 'Heat index 37.', advice: 'Stay indoors at midday.' };
  assert.match(verifyClaim(heat, f).reason, /stay-indoors/);
  assert.match(verifyClaim({ ...heat, advice: 'Tetap di dalam rumah saat siang.' }, f).reason, /stay-indoors/);
  assert.equal(verifyClaim({ ...heat, advice: 'Rest in the shade and drink water often.' }, f).ok, true);
  assert.equal(verifyClaim({ fact_ids: ['aqi-0'], level: 'unhealthy', evidence: 'AQI 155.', advice: 'Stay indoors if you can.' }, f).ok, true);
});

test('decimal comma (Indonesian number format) is read as a decimal point', () => {
  const f = [{ id: 'heat-0', hazard: 'heat', level: 'extreme caution', severity: 2, value: 37.6 }, { id: 'pm25-0', hazard: 'heat', level: 'n/a', severity: 0, value: 71.7 }];
  const c = { fact_ids: ['heat-0', 'pm25-0'], level: 'extreme caution', evidence: 'Indeks panas memuncak di 37,6 °C; PM2,5 mencapai 71,7.', advice: 'Minum air lebih sering.' };
  assert.equal(verifyClaim(c, f).ok, true);
  assert.match(verifyClaim({ ...c, evidence: 'Indeks panas 39,9 °C.' }, f).reason, /not in cited/);
});

test('model claims must state the value of every cited day', () => {
  const f = [
    { id: 'heat-0', hazard: 'heat', level: 'extreme caution', severity: 2, value: 31.6 },
    { id: 'heat-1', hazard: 'heat', level: 'extreme caution', severity: 2, value: 32.9 },
    { id: 'heat-2', hazard: 'heat', level: 'extreme caution', severity: 2, value: 33.7 },
    { id: 'uv-0', hazard: 'uv', level: 'extra protection needed', severity: 2, value: 8 },
    { id: 'uv-1', hazard: 'uv', level: 'extra protection needed', severity: 2, value: 8 },
  ];
  const c = { fact_ids: ['heat-2', 'heat-0', 'heat-1'], level: 'extreme caution', evidence: 'The heat index is 33.7 °C on Friday. It is 31.6 °C today and tomorrow.', advice: 'Rest in the shade.' };
  assert.equal(verifyClaim(c, f).ok, true); // notices and plain checks: not strict
  assert.match(verifyAll({ claims: [c] }, f).rejected[0].reason, /not stated/); // 32.9 is cited but never said
  const full = { ...c, evidence: 'The heat index is 33.7 °C on Friday. It is 31.6 °C today. It is 32.9 °C tomorrow.' };
  assert.equal(verifyAll({ claims: [full] }, f).verified.length, 1);
  const same = { fact_ids: ['uv-0', 'uv-1'], level: 'extra protection needed', evidence: 'The UV index is 8 today and tomorrow.', advice: 'Wear a hat.' };
  assert.equal(verifyAll({ claims: [same] }, f).verified.length, 1); // one number may serve two days with the same value
});
