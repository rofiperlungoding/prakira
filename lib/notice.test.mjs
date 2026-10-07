import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotice, uncovered, isSerious } from './notice.mjs';
import { verifyClaim } from './verify.mjs';

const facts = [
  { id: 'heat-0', hazard: 'heat', day: 'today', value: 43.1, unit: '°C', severity: 3, level: 'danger' },
  { id: 'heat-1', hazard: 'heat', day: 'tomorrow', value: 30, unit: '°C', severity: 1, level: 'caution' },
  { id: 'aqi-0', hazard: 'air', day: 'today', value: 155, unit: '', severity: 3, level: 'unhealthy' },
  { id: 'pm25-0', hazard: 'air', day: 'today', value: 71.7, unit: 'µg/m³', severity: 0, level: 'n/a' },
  { id: 'rain-0', hazard: 'rain', day: 'today', value: 30, unit: 'mm', severity: 2, level: 'moderate' },
  { id: 'uv-0', hazard: 'uv', day: 'today', value: 9, unit: '', severity: 2, level: 'extra protection needed' },
];

test('isSerious uses per-hazard thresholds and ignores n/a facts', () => {
  assert.deepEqual(facts.filter(isSerious).map((f) => f.id), ['heat-0', 'aqi-0', 'uv-0']);
});

test('uncovered lists serious facts no claim cites first', () => {
  const claims = [{ fact_ids: ['heat-0'] }, { fact_ids: ['pm25-0', 'aqi-0'] }];
  assert.deepEqual(uncovered(facts, claims).map((f) => f.id), ['aqi-0', 'uv-0']);
  assert.deepEqual(uncovered(facts, []).length, 3);
});

test('notices pass the same verifier as model claims, in both languages', () => {
  for (const lang of ['en', 'id']) {
    for (const f of facts.filter(isSerious)) {
      const n = buildNotice(f, lang);
      assert.equal(n.kind, 'notice');
      assert.deepEqual(verifyClaim(n, facts), { ok: true }, `${lang} ${f.id}: ${n.evidence}`);
    }
  }
});

test('notice text', () => {
  assert.equal(buildNotice(facts[0], 'en').evidence, 'The heat index peaks at 43.1 °C today (danger).');
  assert.equal(buildNotice(facts[2], 'id').evidence, 'AQI AS memuncak di 155 hari ini (tidak sehat).');
  assert.equal(buildNotice(facts[0], 'xx').advice, buildNotice(facts[0], 'en').advice);
});
