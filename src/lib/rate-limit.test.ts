import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, retryText, stepRate } from './rate-limit.ts';

test('stepRate mengizinkan sampai batas lalu menolak dalam jendela yang sama', () => {
  let state = null;
  const results = [];
  for (let i = 0; i < 4; i++) {
    const d = stepRate(state, 1_000, 3, 60_000);
    state = d.state;
    results.push(d.ok);
  }
  assert.deepEqual(results, [true, true, true, false]);
  assert.equal(stepRate(state, 31_000, 3, 60_000).retryAfterSec, 30);
});

test('stepRate mereset hitungan setelah jendela lewat', () => {
  const d = stepRate({ count: 99, resetAt: 5_000 }, 5_000, 3, 60_000);
  assert.equal(d.ok, true);
  assert.deepEqual(d.state, { count: 1, resetAt: 65_000 });
});

test('clientIp hanya memakai X-Forwarded-For bila proxy dipercaya', () => {
  const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
  assert.equal(clientIp(h, '10.0.0.1', true), '1.2.3.4');
  assert.equal(clientIp(h, '10.0.0.1', false), '10.0.0.1');
  assert.equal(clientIp(new Headers(), undefined, false), 'unknown');
});

test('retryText membulatkan ke menit', () => {
  assert.equal(retryText(20), 'sekitar 1 menit');
  assert.equal(retryText(601), '11 menit');
});
