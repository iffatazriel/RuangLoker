import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, formatRp, isProductKey, orderCode, PRODUCTS } from './pricing.ts';

test('harga sesuai blueprint', () => {
  assert.equal(PRODUCTS.kredit10.priceRp, 10_000);
  assert.equal(PRODUCTS.kredit10.credits, 10);
  assert.equal(PRODUCTS.review_cv.priceRp, 49_000);
  assert.equal(formatRp(49_000), 'Rp49.000');
});

test('kunci produk divalidasi', () => {
  assert.ok(isProductKey('kredit10'));
  assert.ok(!isProductKey('toString'));
  assert.ok(!isProductKey('gratis'));
});

test('kode pesanan tanpa karakter ambigu', () => {
  const code = orderCode(() => new Uint8Array([0, 8, 14, 30, 255]));
  assert.match(code, /^RL-[A-Z2-9]{5}$/);
  assert.ok(!/[01OIL]/.test(code.slice(3)));
});

test('transisi status pesanan', () => {
  assert.ok(canTransition('konfirmasi', 'menunggu'));
  assert.ok(!canTransition('konfirmasi', 'dibayar'));
  assert.ok(canTransition('selesai', 'dibayar'));
  assert.ok(!canTransition('batal', 'dibayar'));
  assert.ok(!canTransition('hapus', 'menunggu'));
});
