import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJobFromHtml, guessCategory, htmlToText, matchCity } from './job-import.ts';
import { findDuplicates, normalizeUrl, titleSimilarity } from './job-dedupe.ts';
import { classifyLinkResponse, isLinkFlagged } from './link-check.ts';
import { isPublicAddress } from './safe-fetch.ts';

const now = new Date('2026-11-21T05:00:00Z');
const ld = (o: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(o)}</script></head></html>`;

const posting = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'Staff Gudang (Shift)',
  hiringOrganization: { '@type': 'Organization', name: 'PT Sinar Jaya Abadi' },
  description: '&lt;p&gt;Menyusun barang masuk di gudang.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Min. SMA/SMK&lt;/li&gt;&lt;li&gt;Siap shift&lt;/li&gt;&lt;/ul&gt;',
  employmentType: ['FULL_TIME'],
  validThrough: '2026-12-31T23:59:00+07:00',
  jobLocation: { '@type': 'Place', address: { addressLocality: 'Cikarang', addressRegion: 'Jawa Barat' } },
  baseSalary: { '@type': 'MonetaryAmount', currency: 'IDR', value: { minValue: 4800000, maxValue: 5500000, unitText: 'MONTH' } },
};

test('JobPosting JSON-LD mengisi form', () => {
  const r = extractJobFromHtml(ld({ '@graph': [{ '@type': 'WebPage' }, posting] }), 'https://www.karier.sinarjaya.co.id/loker/1', now);
  assert.equal(r.structured, true);
  assert.equal(r.values.title, 'Staff Gudang (Shift)');
  assert.equal(r.values.company, 'PT Sinar Jaya Abadi');
  assert.equal(r.values.city, 'Bekasi');
  assert.equal(r.values.category, 'Gudang');
  assert.equal(r.values.employmentType, 'Full-time');
  assert.equal(r.values.salaryMin, '4800000');
  assert.equal(r.values.expiresAt, '2026-12-31');
  assert.equal(r.values.requirements, 'Min. SMA/SMK\nSiap shift');
  assert.equal(r.values.applyChannel, 'Portal Eksternal');
  assert.equal(r.values.verificationStatus, 'pending');
  assert.equal(r.values.sourceName, 'Situs karier.sinarjaya.co.id');
  assert.match(r.values.description!, /Menyusun barang masuk/);
});

test('gaji non-IDR atau per jam diabaikan, lowongan lewat diberi catatan', () => {
  const r = extractJobFromHtml(
    ld({ ...posting, validThrough: '2026-01-01', baseSalary: { currency: 'USD', value: { value: 10 } }, applicationContact: { email: 'hrd@sj.co.id' } }),
    'https://sj.co.id/a',
    now,
  );
  assert.equal(r.values.salaryMin, undefined);
  assert.equal(r.values.expiresAt, undefined);
  assert.equal(r.values.applyChannel, 'Email');
  assert.equal(r.values.applyTarget, 'hrd@sj.co.id');
  assert.ok(r.notes.some((n) => n.includes('sudah berakhir')));
});

test('tanpa JobPosting memakai og:title dan meta description', () => {
  const r = extractJobFromHtml('<meta property="og:title" content="Loker Kasir &amp; Barista"><meta name="description" content="Dibutuhkan segera">', 'https://ig.example/p/1', now);
  assert.equal(r.structured, false);
  assert.equal(r.values.title, 'Loker Kasir & Barista');
  assert.equal(r.values.description, 'Dibutuhkan segera');
});

test('kota, kategori, dan teks', () => {
  assert.equal(matchCity('South Jakarta'), 'Jakarta Selatan');
  assert.equal(matchCity('Serpong, Tangerang'), 'Tangerang Selatan');
  assert.equal(matchCity('Jakarta'), null);
  assert.equal(guessCategory('Kasir Minimarket'), 'Retail');
  assert.equal(htmlToText('<p>A&nbsp;B</p>C'), 'A B\nC');
});

test('deteksi duplikat', () => {
  const existing = [
    { id: 1, title: 'Staff Gudang', company: 'PT. Sinar Jaya Abadi', sourceUrl: 'https://sj.co.id/loker/1/?utm_source=ig' },
    { id: 2, title: 'Kasir', company: 'Sinar Jaya Abadi', sourceUrl: null },
  ];
  assert.deepEqual(findDuplicates({ title: 'Apa saja', company: 'X', sourceUrl: 'https://www.sj.co.id/loker/1' }, existing).map((d) => [d.job.id, d.reason]), [[1, 'tautan']]);
  assert.deepEqual(findDuplicates({ title: 'Staff Gudang Shift', company: 'Sinar Jaya Abadi Tbk' }, existing).map((d) => d.job.id), [1]);
  assert.equal(findDuplicates({ title: 'Staff Gudang', company: 'Sinar Jaya Abadi' }, existing, 1).length, 0);
  assert.equal(normalizeUrl('nope'), null);
  assert.ok(titleSimilarity('Admin Gudang', 'Staff Gudang') < 0.5);
});

test('klasifikasi cek tautan', () => {
  assert.equal(classifyLinkResponse({ status: 404, html: '' }, now), 'mati');
  assert.equal(classifyLinkResponse({ status: 503, html: '' }, now), 'gagal');
  assert.equal(classifyLinkResponse(null, now), 'gagal');
  assert.equal(classifyLinkResponse({ status: 200, html: '<p>Lowongan ini sudah ditutup.</p>' }, now), 'ditutup');
  assert.equal(classifyLinkResponse({ status: 200, html: ld({ ...posting, validThrough: '2026-11-01' }) }, now), 'ditutup');
  assert.equal(classifyLinkResponse({ status: 200, html: ld(posting) }, now), 'ok');
  assert.equal(isLinkFlagged({ sourceStatus: 'gagal', sourceFailCount: 2 }), false);
  assert.equal(isLinkFlagged({ sourceStatus: 'gagal', sourceFailCount: 3 }), true);
});

test('alamat internal ditolak', () => {
  for (const a of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fd00::1']) assert.equal(isPublicAddress(a), false, a);
  assert.equal(isPublicAddress('8.8.8.8'), true);
});
