import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimiter, ttlCache } from './limits.mjs';

test('rate limiter allows max per window per key, then reports the wait, then resets', () => {
  let t = 0;
  const allow = rateLimiter(2, 10_000, () => t);
  assert.deepEqual([allow('a'), allow('a')], [0, 0]);
  t = 4000;
  assert.equal(allow('a'), 6); // 6 s left in the window
  assert.equal(allow('b'), 0); // other keys are independent
  t = 10_000;
  assert.equal(allow('a'), 0); // new window
});

test('ttl cache expires entries and drops the oldest when full', () => {
  let t = 0;
  const c = ttlCache(1000, 2, () => t);
  c.set('a', 1); c.set('b', 2);
  assert.equal(c.get('a'), 1);
  c.set('c', 3); // evicts 'a'
  assert.deepEqual([c.get('a'), c.get('b'), c.get('c')], [undefined, 2, 3]);
  t = 1000;
  assert.equal(c.get('b'), undefined);
});
