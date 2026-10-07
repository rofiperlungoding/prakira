import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyClaim, verifyAll, adviceProblem } from './verify.mjs';
import { evidenceFor } from './notice.mjs';
import { thresholds } from './facts.mjs';

const f = (id, hazard, i, value, unit, severity, level) => ({ id, hazard, value, unit, severity, level, date: `2026-10-${String(8 + i).padStart(2, '0')}`, day: ['today', 'tomorrow', 'the day after tomorrow'][i], weekday: ['Thursday', 'Friday', 'Saturday'][i] });
const facts = [
  f('heat-0', 'heat', 0, 36.8, '°C', 2, 'extreme caution'),
  f('heat-1', 'heat', 1, 30.1, '°C', 1, 'caution'),
  f('heat-2', 'heat', 2, 41.2, '°C', 3, 'danger'),
  f('aqi-0', 'air', 0, 219, '', 4, 'very unhealthy'),
  f('aqi-1', 'air', 1, 216, '', 4, 'very unhealthy'),
  f('aqi-2', 'air', 2, 224, '', 4, 'very unhealthy'),
  f('pm25-0', 'air', 0, 71.7, 'µg/m³', 0, 'n/a'),
  f('uv-0', 'uv', 0, 5, '', 1, 'protection needed'),
  f('rain-0', 'rain', 0, 3, 'mm', 1, 'light'),
];
const th = thresholds([]); // heat 2, rain 3, air 2, uv 2

test('evidence is built from the data, in day order, in both languages', () => {
  const air = facts.filter((x) => x.id.startsWith('aqi-'));
  assert.equal(evidenceFor(air, 'en'), 'The US AQI peaks at 219 today, 216 tomorrow and 224 the day after tomorrow.');
  assert.equal(evidenceFor([air[2], air[0]], 'en'), 'The US AQI peaks at 219 today and 224 the day after tomorrow.'); // order of the input does not matter
  assert.equal(evidenceFor([facts[0], facts[2]], 'id'), 'Indeks panas memuncak di 36,8 °C hari ini dan 41,2 °C lusa.');
  assert.equal(evidenceFor(air, 'id'), 'AQI AS memuncak di 219 hari ini, 216 besok, dan 224 lusa.');
});

test('a kept action gets its facts, level and evidence from the data, most severe day first', () => {
  const r = verifyAll({ claims: [{ hazard: 'heat', advice: 'Rest in the shade and drink water often.' }] }, facts, th, 'en');
  assert.equal(r.total, 1);
  assert.deepEqual(r.verified, [{ hazard: 'heat', fact_ids: ['heat-2', 'heat-0'], level: 'danger', evidence: 'The heat index peaks at 36.8 °C today and 41.2 °C the day after tomorrow.', advice: 'Rest in the shade and drink water often.' }]);
});

test('the model cannot change a number: anything it writes besides the action is ignored', () => {
  const sneaky = { hazard: 'air', advice: 'Wear a mask outside.', evidence: 'The US AQI is 50 today.', level: 'good', fact_ids: ['uv-0'] };
  const [item] = verifyAll({ claims: [sneaky] }, facts, th, 'en').verified;
  assert.equal(item.evidence, 'The US AQI peaks at 219 today, 216 tomorrow and 224 the day after tomorrow.');
  assert.equal(item.level, 'very unhealthy');
  assert.deepEqual(item.fact_ids, ['aqi-2', 'aqi-0', 'aqi-1']);
});

test('rejections: digits, hazards that are not serious, duplicates, empty or oversized advice, garbage', () => {
  const run = (claims) => verifyAll({ claims }, facts, th, 'en');
  assert.match(run([{ hazard: 'heat', advice: 'Stay in from 11 to 4.' }]).rejected[0].reason, /contains a number/);
  assert.match(run([{ hazard: 'uv', advice: 'Wear a hat.' }]).rejected[0].reason, /not a serious hazard/); // uv severity 1, threshold 2
  assert.match(run([{ hazard: 'rain', advice: 'Carry an umbrella.' }]).rejected[0].reason, /not a serious hazard/);
  assert.match(run([{ hazard: 'wind', advice: 'Tie things down.' }]).rejected[0].reason, /not a serious hazard/);
  const twice = run([{ hazard: 'air', advice: 'Wear a mask outside.' }, { hazard: 'air', advice: 'Close the windows.' }]);
  assert.deepEqual([twice.verified.length, twice.rejected[0].reason], [1, 'second action for the same hazard']);
  assert.match(run([{ hazard: 'heat', advice: '   ' }]).rejected[0].reason, /missing advice/);
  assert.match(run([{ hazard: 'heat', advice: 'x'.repeat(300) }]).rejected[0].reason, /too long/);
  assert.match(run([null]).rejected[0].reason, /not an object/);
  assert.deepEqual(verifyAll({ claims: 'x' }, facts, th, 'en'), { verified: [], rejected: [], total: 0 });
  assert.equal(verifyAll(null, facts, th, 'en').total, 0);
});

test('the household changes which hazards may be advised on', () => {
  const uv = [{ hazard: 'uv', advice: 'Wear a hat and long sleeves.' }];
  assert.equal(verifyAll({ claims: uv }, facts, thresholds([]), 'en').verified.length, 0);
  assert.equal(verifyAll({ claims: uv }, facts, thresholds(['outdoor_worker']), 'en').verified.length, 1);
});

test('stay-indoors advice is kept only at levels where it is proportionate', () => {
  assert.match(adviceProblem('Stay indoors at midday.', 'extreme caution'), /stay-indoors/);
  assert.match(adviceProblem('Tetap di dalam rumah saat siang.', 'caution'), /stay-indoors/);
  assert.equal(adviceProblem('Stay indoors if you can.', 'very unhealthy'), null);
  assert.equal(adviceProblem('Rest in the shade and drink water often.', 'extreme caution'), null);
  // The level that counts is the most severe day of the hazard: heat reaches "danger" here.
  assert.equal(verifyAll({ claims: [{ hazard: 'heat', advice: 'Stay inside on the hottest day.' }] }, facts, th, 'en').verified.length, 1);
});

test('consistency check for finished items (also used on standard notices)', () => {
  const ok = { fact_ids: ['aqi-0', 'pm25-0'], level: 'very unhealthy', evidence: 'US AQI peaks at 219 and PM2.5 at 71.7 µg/m³.', advice: 'Wear a mask outside.' };
  assert.deepEqual(verifyClaim(ok, facts, th), { ok: true });
  assert.match(verifyClaim({ ...ok, evidence: 'US AQI peaks at 250.' }, facts, th).reason, /not in cited facts/);
  assert.match(verifyClaim({ ...ok, level: 'good' }, facts, th).reason, /level/);
  assert.match(verifyClaim({ ...ok, fact_ids: ['aqi-0', 'heat-0'] }, facts, th).reason, /more than one hazard/);
  assert.match(verifyClaim({ ...ok, fact_ids: ['nope-9'] }, facts, th).reason, /unknown/);
  assert.equal(verifyClaim({ ...ok, evidence: 'AQI AS 219 dan PM2,5 71,7.' }, facts, th).ok, true); // decimal comma
  assert.equal(verifyClaim({ ...ok, evidence: 'About 220.' }, facts, th).ok, false); // 220 is not 219
  assert.equal(verifyClaim(null, facts, th).ok, false);
});
