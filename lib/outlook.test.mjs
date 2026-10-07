import test from 'node:test';
import assert from 'node:assert/strict';
import { hotDaysPerYear, buildOutlook, joinDaily } from './outlook.mjs';
import { tracer } from './trace.mjs';

// A tiny calendar: `n` days per listed year, each with the given value.
function series(years) {
  const time = [];
  const values = [];
  for (const [y, vals] of years) vals.forEach((v, i) => { time.push(`${y}-07-${String(i + 1).padStart(2, '0')}`); values.push(v); });
  return { time, values };
}

test('hotDaysPerYear: threshold is inclusive, years outside the range and nulls are ignored', () => {
  const { time, values } = series([[1990, [40, 40]], [1991, [35, 34.9, 36]], [1992, [20, null, 35]], [2021, [40]]]);
  assert.equal(hotDaysPerYear(time, values, 35, 1991, 2020), (2 + 1) / 2);
  assert.equal(hotDaysPerYear(time, values, 35, 1990, 1990), 2);
  assert.equal(hotDaysPerYear(time, values, 35, 2000, 2010), null);
});

test('buildOutlook: median and range across models, at 35 deg C when any model reaches a day a year', () => {
  const time = ['2011-07-01', '2011-07-02', '2041-07-01', '2041-07-02', '2041-07-03'];
  const daily = {
    time,
    temperature_2m_max_A: [36, 20, 36, 36, 36],
    temperature_2m_max_B: [20, 20, 36, 36, 20],
    temperature_2m_max_C: [36, 36, 36, 20, 20],
  };
  assert.deepEqual(buildOutlook(daily, ['A', 'B', 'C']), { threshold: 35, models: 3, rare: false, periods: { past: [2011, 2020], future: [2041, 2050] }, past: { median: 1, min: 0, max: 2 }, future: { median: 2, min: 1, max: 3 } });
});

test('buildOutlook: falls back to 30 deg C, then to rare; null without data', () => {
  const time = ['2011-07-01', '2041-07-01'];
  assert.equal(buildOutlook({ time, temperature_2m_max_A: [31, 32] }, ['A']).threshold, 30);
  assert.deepEqual(buildOutlook({ time, temperature_2m_max_A: [10, 12] }, ['A']), { threshold: 30, models: 1, periods: { past: [2011, 2020], future: [2041, 2050] }, rare: true });
  assert.equal(buildOutlook({ time }, ['A']), null);
  assert.equal(buildOutlook({ time: ['2011-07-01'], temperature_2m_max_A: [40] }, ['A']), null); // no future data
  assert.deepEqual(joinDaily({ time: ['a'], x: [1] }, { time: ['b'], x: [2] }), { time: ['a', 'b'], x: [1, 2] });
});

test('tracer: events in order, durations measured, finished steps listed, a broken listener is harmless', () => {
  let t = 0;
  const seen = [];
  const tr = tracer((e) => seen.push(e), () => t);
  tr.start('forecast'); t = 400; tr.done('forecast', { values: 18 });
  tr.start('model', { attempt: 1 }); t = 2400; tr.fail('model', 'HTTP 429', { attempt: 1 });
  assert.deepEqual(seen.map((e) => `${e.id}:${e.state}`), ['forecast:start', 'forecast:done', 'model:start', 'model:fail']);
  assert.deepEqual(tr.list, [{ id: 'forecast', state: 'done', ms: 400, values: 18 }, { id: 'model', state: 'fail', ms: 2000, attempt: 1, error: 'HTTP 429' }]);
  const bad = tracer(() => { throw new Error('socket closed'); }, () => 0);
  bad.start('rules'); bad.done('rules');
  assert.equal(bad.list.length, 1);
});
