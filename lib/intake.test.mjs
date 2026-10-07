import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanIntake } from './intake.mjs';

test('keeps only allowed profile values, without duplicates', () => {
  assert.deepEqual(cleanIntake({ place: 'Depok', profile: ['older_adult', 'respiratory_condition', 'older_adult', 'millionaire', 7, null] }), { place: 'Depok', profile: ['older_adult', 'respiratory_condition'] });
});

test('place is a short plain name or nothing', () => {
  assert.equal(cleanIntake({ place: '  Kota Bandung, Jawa Barat ' }).place, 'Kota Bandung, Jawa Barat');
  assert.equal(cleanIntake({ place: 'São Paulo' }).place, 'São Paulo');
  assert.equal(cleanIntake({ place: 'x' }).place, '');
  assert.equal(cleanIntake({ place: 'Depok</script><script>alert(1)' }).place, '');
  assert.equal(cleanIntake({ place: 'lat=1&lon=2' }).place, '');
  assert.equal(cleanIntake({ place: 42 }).place, '');
  assert.equal(cleanIntake({ place: 'A'.repeat(200) }).place.length, 80);
});

test('garbage in gives an empty, well-formed result', () => {
  for (const raw of [null, undefined, 'text', 5, [], { profile: 'older_adult' }, { place: null, profile: null }]) {
    assert.deepEqual(cleanIntake(raw), { place: '', profile: [] });
  }
});
