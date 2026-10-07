import test from 'node:test';
import assert from 'node:assert/strict';
import { agreement, label } from './models.mjs';

// Hourly UTC times for two days.
const times = [];
for (const d of ['2026-10-08', '2026-10-09']) for (let h = 0; h < 24; h++) times.push(`${d}T${String(h).padStart(2, '0')}:00`);
const flat = (v) => times.map(() => v);

test('only the native 6-hourly steps are compared, and the largest difference of the day is reported', () => {
  const a = flat(30);
  const b = flat(30);
  b[times.indexOf('2026-10-08T03:00')] = 40; // an interpolated hour: ignored
  b[times.indexOf('2026-10-08T06:00')] = 32.4; // native step: counts
  b[times.indexOf('2026-10-08T18:00')] = 29;
  assert.deepEqual(agreement(times, a, b, 0, ['2026-10-08']), [{ date: '2026-10-08', diff: 2.4, steps: 4, label: 'differ somewhat' }]);
});

test('steps are assigned to the local date, including half-hour time zones', () => {
  const a = flat(30);
  const b = flat(30);
  b[times.indexOf('2026-10-08T18:00')] = 35; // 18:00 UTC is 01:00 on the 9th in Jakarta (UTC+7)
  const jakarta = agreement(times, a, b, 7 * 3600, ['2026-10-08', '2026-10-09']);
  assert.deepEqual(jakarta.map((x) => [x.date, x.diff]), [['2026-10-08', 0], ['2026-10-09', 5]]);
  const delhi = agreement(times, a, b, 5.5 * 3600, ['2026-10-08']); // 18:00 UTC is 23:30 local, still the 8th
  assert.deepEqual([delhi[0].diff, delhi[0].label], [5, 'differ']);
});

test('missing values are skipped; a date with no shared step is left out', () => {
  const a = flat(30);
  const b = flat(null);
  b[times.indexOf('2026-10-09T12:00')] = 30.6;
  assert.deepEqual(agreement(times, a, b, 0, ['2026-10-08', '2026-10-09']), [{ date: '2026-10-09', diff: 0.6, steps: 1, label: 'agree' }]);
  assert.deepEqual(agreement(times, a, flat(null), 0, ['2026-10-08']), []);
});

test('labels at the cut points', () => {
  assert.deepEqual([0, 1, 1.1, 3, 3.1].map(label), ['agree', 'agree', 'differ somewhat', 'differ somewhat', 'differ']);
});
