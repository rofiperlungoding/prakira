import test from 'node:test';
import assert from 'node:assert/strict';
import { heatIndexF, level, buildFacts } from './facts.mjs';

// Published NWS examples: https://www.weather.gov/ama/heatindex (checked 2026-10-07).
test('heat index matches NWS published examples', () => {
  assert.equal(Math.round(heatIndexF(100, 55)), 124);
  assert.equal(Math.round(heatIndexF(100, 15)), 96);
});

test('heat index: cool air uses the simple formula and stays near air temperature', () => {
  const hi = heatIndexF(70, 50);
  assert.ok(hi < 80 && Math.abs(hi - 70) < 3, String(hi));
});

test('heat index adjustments apply only in their ranges', () => {
  assert.ok(heatIndexF(95, 10) < heatIndexF(95, 13)); // low-humidity adjustment lowers it
  assert.ok(heatIndexF(82, 95) > heatIndexF(82, 85)); // high-humidity adjustment raises it
});

test('heat bands at every boundary (whole deg F)', () => {
  const at = (f) => level('heat', f).level;
  assert.deepEqual([79, 80, 89, 90, 102, 103, 124, 125].map(at),
    ['low', 'caution', 'caution', 'extreme caution', 'extreme caution', 'danger', 'danger', 'extreme danger']);
});

test('rain, AQI and UV bands at boundaries', () => {
  const r = (v) => level('rain', v).level;
  assert.deepEqual([0.9, 1, 19.9, 20, 49.9, 50, 99.9, 100, 149.9, 150].map(r),
    ['little or no rain', 'light', 'light', 'moderate', 'moderate', 'heavy', 'heavy', 'very heavy', 'very heavy', 'extreme']);
  const a = (v) => level('aqi', v).level;
  assert.deepEqual([50, 51, 100, 101, 150, 151, 200, 201, 300, 301].map(a),
    ['good', 'moderate', 'moderate', 'unhealthy for sensitive groups', 'unhealthy for sensitive groups', 'unhealthy', 'unhealthy', 'very unhealthy', 'very unhealthy', 'hazardous']);
  const u = (v) => level('uv', v).level;
  assert.deepEqual([0, 2, 3, 7, 8, 12].map(u), ['low', 'low', 'protection needed', 'protection needed', 'extra protection needed', 'extra protection needed']);
});

test('buildFacts: hourly heat index, rounded UV, daily maxima, missing data skipped', () => {
  const fc = {
    daily: { time: ['2026-10-07'], precipitation_sum: [null], precipitation_probability_max: [78], uv_index_max: [2.5] },
    hourly: {
      time: ['2026-10-07T12:00', '2026-10-07T13:00', '2026-10-08T12:00'],
      temperature_2m: [30, 37.78, 45], // 37.78 C = 100 F
      relative_humidity_2m: [50, 55, 90],
    },
  };
  const aq = { hourly: { time: ['2026-10-07T00:00', '2026-10-07T01:00'], us_aqi: [60, 87], pm2_5: [20, 30.2] } };
  const f = buildFacts(fc, aq);
  assert.deepEqual(f.map((x) => x.id), ['heat-0', 'rainprob-0', 'aqi-0', 'pm25-0', 'uv-0']);
  const heat = f[0];
  assert.equal(heat.level, 'danger'); // 100 F at 55% is 124 F; the next day's hotter hour is ignored
  assert.ok(Math.abs(heat.value - 51.1) < 0.3, String(heat.value));
  assert.equal(f.find((x) => x.id === 'aqi-0').value, 87);
  const uv = f.find((x) => x.id === 'uv-0');
  assert.deepEqual([uv.value, uv.level], [3, 'protection needed']); // 2.5 rounds half up to 3
  assert.equal(heat.weekday, 'Wednesday');
});

test('buildFacts tolerates missing air quality', () => {
  const fc = { daily: { time: ['2026-10-07'], precipitation_sum: [12], precipitation_probability_max: [null], uv_index_max: [null] }, hourly: { time: [], temperature_2m: [], relative_humidity_2m: [] } };
  const f = buildFacts(fc, { hourly: { time: [], us_aqi: [], pm2_5: [] } });
  assert.deepEqual(f.map((x) => [x.id, x.level]), [['rain-0', 'light']]);
});

test('peak time: heat and UV carry the local hour of their maximum; air does not', () => {
  const fc = {
    daily: { time: ['2026-10-07'], precipitation_sum: [0], precipitation_probability_max: [1], uv_index_max: [7.4] },
    hourly: {
      time: ['2026-10-07T09:00', '2026-10-07T12:00', '2026-10-07T15:00', '2026-10-08T15:00'],
      temperature_2m: [28, 33, 36, 44],
      relative_humidity_2m: [70, 55, 45, 40],
      uv_index: [3, 7.4, 4, 9],
    },
  };
  const aq = { hourly: { time: ['2026-10-07T03:00'], us_aqi: [120], pm2_5: [40] } };
  const f = Object.fromEntries(buildFacts(fc, aq).map((x) => [x.id, x]));
  assert.equal(f['heat-0'].peak, '15:00'); // hottest hour of that date; the next day's hotter hour is ignored
  assert.equal(f['uv-0'].peak, '12:00');
  assert.equal(f['uv-0'].value, 7); // value still comes from the daily maximum, rounded
  assert.equal('peak' in f['aqi-0'], false);
});
