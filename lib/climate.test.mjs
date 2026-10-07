import test from 'node:test';
import assert from 'node:assert/strict';
import { byCalendarDay, normalFor, buildContext } from './climate.mjs';
import { buildCompound } from './notice.mjs';

// Two years; value = day of month, except one missing value.
const daily = { time: [], temperature_2m_max: [] };
for (const y of [1991, 1992]) {
  for (let d = 1; d <= 31; d++) {
    daily.time.push(`${y}-10-${String(d).padStart(2, '0')}`);
    daily.temperature_2m_max.push(y === 1992 && d === 10 ? null : d);
  }
  daily.time.push(`${y}-12-31`, `${y}-01-01`);
  daily.temperature_2m_max.push(10, 20);
}
const cal = byCalendarDay(daily);

test('normal is the mean of the 7 calendar days centred on the date, over all years', () => {
  assert.equal(normalFor(cal, '2026-10-20'), 20); // days 17..23, both years
  // days 7..13; day 10 is missing in one year: (2*(7+8+9+11+12+13) + 10) / 13
  assert.ok(Math.abs(normalFor(cal, '2026-10-10') - (2 * 60 + 10) / 13) < 1e-9);
});

test('window wraps across the year end, and no data gives null', () => {
  assert.equal(normalFor(cal, '2026-01-01'), 15); // only 12-31 (10) and 01-01 (20) exist in the window
  assert.equal(normalFor(cal, '2026-06-15'), null);
});

test('context rounds to whole degrees and skips days without data', () => {
  const ctx = buildContext(cal, [{ date: '2026-10-20', value: 23.4 }, { date: '2026-06-15', value: 30 }, { date: '2026-10-21', value: null }]);
  assert.deepEqual(ctx, [{ date: '2026-10-20', forecast: 23, normal: 20, anomaly: 3 }]);
});

test('compound day: heat at extreme caution or worse together with air at unhealthy-for-sensitive-groups or worse', () => {
  const f = (id, hazard, day, severity) => ({ id, hazard, day, severity, level: 'x', value: 1, unit: '' });
  const none = [f('heat-0', 'heat', 'today', 2), f('aqi-0', 'air', 'today', 1), f('heat-1', 'heat', 'tomorrow', 1), f('aqi-1', 'air', 'tomorrow', 3)];
  assert.equal(buildCompound(none, 'en'), null);
  const both = [...none, f('heat-2', 'heat', 'the day after tomorrow', 2), f('aqi-2', 'air', 'the day after tomorrow', 2), f('pm25-2', 'air', 'the day after tomorrow', 0)];
  const n = buildCompound(both, 'en');
  assert.deepEqual([n.kind, n.fact_ids], ['compound', ['heat-2', 'aqi-2']]);
  assert.match(n.evidence, /the day after tomorrow/);
  assert.match(buildCompound(both, 'id').evidence, /lusa/);
  assert.equal(/\d/.test(n.advice), false);
});
