import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApplication,
  buildEmailLetter,
  CV_LINK_PLACEHOLDER,
  gmailComposeUrl,
  letterFileName,
  normalizeWaNumber,
  pickSkills,
  waUrl,
  type LetterInput,
} from './letter.ts';

const base: LetterInput = {
  applicant: {
    fullName: 'Budi Santoso',
    email: 'budi@contoh.id',
    phone: '0812-3456-7890',
    city: 'Jakarta Selatan',
    education: 'SMK Administrasi Perkantoran',
    experience: 'magang admin di CV Sinar Logistik',
    skills: ['Microsoft Excel', 'Google Sheets', 'VLOOKUP', 'Komunikasi'],
  },
  job: { title: 'Staff Admin', company: 'PT Maju Bersama', city: 'Jakarta Selatan', channel: 'Email', requirements: ['Menguasai VLOOKUP', 'Google Sheets'] },
  template: 'formal',
  tone: 'formal',
  date: new Date('2026-11-21T03:00:00Z'),
};

test('surat email deterministik dan memuat data profil serta lowongan', () => {
  const a = buildEmailLetter(base);
  assert.equal(a, buildEmailLetter(base));
  for (const s of ['Staff Admin', 'PT Maju Bersama', 'Budi Santoso', '21 November 2026', 'Dengan hormat,', 'Hormat saya,']) {
    assert.ok(a.includes(s), s);
  }
});

test('keahlian yang disebut lowongan didahulukan, maksimal tiga', () => {
  assert.deepEqual(pickSkills(base.applicant.skills, base.job.requirements), ['Google Sheets', 'VLOOKUP', 'Microsoft Excel']);
});

test('nada semi-formal mengganti salam', () => {
  const t = buildEmailLetter({ ...base, tone: 'semi' });
  assert.ok(t.includes('Halo Tim Rekrutmen'));
  assert.ok(!t.includes('Dengan hormat'));
});

test('kanal WhatsApp menghasilkan pesan pendek dengan tempat link CV, bukan klaim lampiran', () => {
  const { subject, body } = buildApplication({ ...base, job: { ...base.job, channel: 'WhatsApp' } });
  assert.equal(subject, 'Lamaran Staff Admin — Budi Santoso');
  assert.ok(body.includes(CV_LINK_PLACEHOLDER));
  assert.ok(!/terlampir|lampirkan/i.test(body));
  assert.ok(body.length < 700);
});

test('profil kosong tidak menghasilkan kalimat rusak', () => {
  const empty = { ...base, applicant: { fullName: '', email: '', phone: '', city: '', education: '', experience: '', skills: [] } };
  const t = buildEmailLetter(empty);
  assert.ok(!t.includes('undefined'));
  assert.ok(!t.includes(' ,'));
  assert.ok(!t.includes('terbiasa dengan .'));
});

test('nama berkas surat rapi', () => {
  assert.equal(letterFileName('Budi Santoso', 'Staff Admin / Gudang'), 'Surat-Lamaran_Budi-Santoso_Staff-Admin-Gudang.pdf');
  assert.equal(letterFileName('', ''), 'Surat-Lamaran_Pelamar_Posisi.pdf');
});

test('nomor WhatsApp dinormalisasi ke 62', () => {
  assert.equal(normalizeWaNumber('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeWaNumber('+62 812 0000 0002'), '6281200000002');
  assert.equal(normalizeWaNumber('12'), '');
  assert.equal(waUrl('abc', 'x'), '');
  assert.ok(waUrl('6281200000002', 'Halo & salam').startsWith('https://wa.me/6281200000002?text=Halo%20%26%20salam'));
});

test('tautan Gmail dipotong di bawah batas dan ditandai', () => {
  const short = gmailComposeUrl('a@b.id', 'S', 'pendek');
  assert.equal(short.truncated, false);
  const long = gmailComposeUrl('a@b.id', 'S', 'x'.repeat(5000));
  assert.equal(long.truncated, true);
  assert.ok(long.url.length <= 2000);
});

test('tautan CV di draf dikembalikan ke placeholder saat disimpan', async () => {
  const { restoreCvLinkPlaceholder } = await import('./letter.ts');
  const body = 'CV saya: https://ruangloker.id/c/-Lk5Br7Q0nGShHt4A_VtBfq5vtzwnFq6\nTerima kasih. Info: https://ruangloker.id/lowongan';
  assert.equal(restoreCvLinkPlaceholder(body), `CV saya: ${CV_LINK_PLACEHOLDER}\nTerima kasih. Info: https://ruangloker.id/lowongan`);
});
