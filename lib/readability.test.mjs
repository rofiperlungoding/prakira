import test from 'node:test';
import assert from 'node:assert/strict';
import { syllables, fleschKincaid } from './readability.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} vs ${b}`);

test('syllable heuristic on common words', () => {
  const expected = { the: 1, shade: 1, water: 2, often: 2, drink: 1, outside: 2, little: 2, free: 1, protection: 3, indoors: 2, sunscreen: 2 };
  for (const [w, n] of Object.entries(expected)) assert.equal(syllables(w), n, w);
});

test('grade matches hand-computed values', () => {
  // 6 words, 1 sentence, 6 syllables: 0.39*6 + 11.8*1 - 15.59
  near(fleschKincaid('The cat sat on the mat.'), -1.45);
  // 8 words, 1 sentence, 10 syllables: 0.39*8 + 11.8*1.25 - 15.59
  near(fleschKincaid('Drink water often and rest in the shade.'), 2.28);
  // two sentences of 3 words, 6 syllables: 0.39*3 + 11.8*1 - 15.59
  near(fleschKincaid('Drink more now. Rest at noon.'), -2.62);
});

test('numbers and units are ignored; text without words gives null', () => {
  near(fleschKincaid('The heat index peaks at 37.2 °C today.'), fleschKincaid('The heat index peaks at today.'));
  assert.equal(fleschKincaid('37.2 °C, 204.'), null);
});
