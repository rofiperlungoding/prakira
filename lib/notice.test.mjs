import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotices, uncovered } from './notice.mjs';
import { thresholds, isSerious } from './facts.mjs';
import { verifyClaim } from './verify.mjs';

const facts = [
  { id: 'heat-0', hazard: 'heat', day: 'today', value: 43.1, unit: '°C', severity: 3, level: 'danger' },
  { id: 'heat-1', hazard: 'heat', day: 'tomorrow', value: 30, unit: '°C', severity: 1, level: 'caution' },
  { id: 'heat-2', hazard: 'heat', day: 'the day after tomorrow', value: 38, unit: '°C', severity: 2, level: 'extreme caution' },
  { id: 'aqi-0', hazard: 'air', day: 'today', value: 155, unit: '', severity: 3, level: 'unhealthy' },
  { id: 'aqi-1', hazard: 'air', day: 'tomorrow', value: 80, unit: '', severity: 1, level: 'moderate' },
  { id: 'pm25-0', hazard: 'air', day: 'today', value: 71.7, unit: 'µg/m³', severity: 0, level: 'n/a' },
  { id: 'rain-0', hazard: 'rain', day: 'today', value: 30, unit: 'mm', severity: 2, level: 'moderate' },
  { id: 'uv-0', hazard: 'uv', day: 'today', value: 9, unit: '', severity: 2, level: 'extra protection needed' },
];
const base = thresholds([]);
const ids = (th) => facts.filter((f) => isSerious(f, th)).map((f) => f.id);

test('base thresholds, and n/a facts are never serious', () => {
  assert.deepEqual(base, { heat: 2, rain: 3, air: 2, uv: 2 });
  assert.deepEqual(ids(base), ['heat-0', 'heat-2', 'aqi-0', 'uv-0']);
});

test('household profile lowers the threshold for its own hazard only', () => {
  assert.deepEqual(ids(thresholds(['older_adult'])), ['heat-0', 'heat-1', 'heat-2', 'aqi-0', 'uv-0']);
  assert.deepEqual(ids(thresholds(['respiratory_condition'])), ['heat-0', 'heat-2', 'aqi-0', 'aqi-1', 'uv-0']);
  assert.deepEqual(ids(thresholds(['flood_prone_home'])), ['heat-0', 'heat-2', 'aqi-0', 'rain-0', 'uv-0']);
  assert.deepEqual(thresholds(['outdoor_worker']), { heat: 1, rain: 3, air: 2, uv: 1 });
});

test('uncovered counts a fact cited in any position as covered', () => {
  const claims = [{ fact_ids: ['heat-0', 'heat-2'] }, { fact_ids: ['aqi-0', 'pm25-0'] }];
  assert.deepEqual(uncovered(facts, claims, base).map((f) => f.id), ['uv-0']);
  assert.equal(uncovered(facts, [], base).length, 4);
});

test('one notice per hazard, worst day first, and it passes the verifier in both languages', () => {
  for (const lang of ['en', 'id']) {
    const n = buildNotices(facts, [], base, lang);
    assert.deepEqual(n.map((x) => x.fact_ids), [['heat-0', 'heat-2'], ['aqi-0'], ['uv-0']]);
    for (const x of n) assert.deepEqual(verifyClaim(x, facts, base), { ok: true }, `${lang}: ${x.evidence}`);
  }
});

test('notice text', () => {
  assert.equal(buildNotices(facts, [], base, 'en')[0].evidence, 'The heat index peaks at 43.1 °C today (danger).');
  assert.equal(buildNotices(facts, [], base, 'id')[1].evidence, 'AQI AS memuncak di 155 hari ini (tidak sehat).');
  assert.equal(buildNotices(facts, [], base, 'xx')[0].advice, buildNotices(facts, [], base, 'en')[0].advice);
  assert.deepEqual(buildNotices(facts, [{ fact_ids: ['heat-0', 'heat-2', 'aqi-0', 'uv-0'] }], base, 'en'), []);
});
