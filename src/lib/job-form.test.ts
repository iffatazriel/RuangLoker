import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companyInitials, emptyJobForm, jobSlug, jobToFormValues, validateJobForm } from './job-form.ts';

const now = new Date('2026-11-21T05:00:00Z');
const valid = () => ({
  ...emptyJobForm(now),
  title: 'Staff Gudang',
  company: 'PT Sinar Jaya Abadi',
  description: 'Menerima, mengecek, dan menyusun barang masuk di gudang distribusi Cikarang.',
  requirements: '- Min. SMA/SMK\n• Siap kerja shift\n\n',
  applyTarget: 'hrd@sinarjaya.co.id',
  sourceName: 'Instagram resmi perusahaan',
});

test('validateJobForm membersihkan persyaratan dan memakai titik tengah kota', () => {
  const r = validateJobForm(valid(), now);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.record.requirements, ['Min. SMA/SMK', 'Siap kerja shift']);
  assert.equal(r.record.province, 'DKI Jakarta');
  assert.equal(r.record.companyInitials, 'SJ');
  assert.equal(r.record.expiresAt.toISOString(), '2026-12-21T16:59:59.000Z');
});

test('validateJobForm menormalkan WhatsApp dan menolak tujuan tidak valid', () => {
  const wa = validateJobForm({ ...valid(), applyChannel: 'WhatsApp', applyTarget: '0812-3456-7890' }, now);
  assert.equal(wa.ok && wa.record.applyTarget, '6281234567890');

  const bad = validateJobForm({ ...valid(), applyChannel: 'Google Form', applyTarget: 'forms.gle/abc' }, now);
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.ok(bad.errors.applyTarget);
});

test('validateJobForm menolak gaji terbalik, tanggal lewat, dan koordinat di luar Indonesia', () => {
  const r = validateJobForm(
    { ...valid(), salaryMin: '6.000.000', salaryMax: '5000000', expiresAt: '2026-11-01', lat: '51.5', lng: '0.1' },
    now,
  );
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.salaryMax && r.errors.expiresAt && r.errors.lat);
});

test('jobToFormValues kembali ke nilai yang sama setelah divalidasi ulang', () => {
  const first = validateJobForm({ ...valid(), lat: '-6.3', lng: '107.1' }, now);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const again = validateJobForm(jobToFormValues(first.record), now);
  assert.deepEqual(again.ok && again.record, first.record);
});

test('companyInitials dan jobSlug', () => {
  assert.equal(companyInitials('PT. Maju Bersama'), 'MB');
  assert.equal(companyInitials('Toko Ēlok'), 'TE');
  assert.equal(jobSlug('Kasir & SPG', 'Toko Ēlok', 'a1b2c3'), 'kasir-spg-toko-elok-a1b2c3');
});
