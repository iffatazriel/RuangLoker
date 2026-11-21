import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES_VERSION, emptySections, scoreCv, type CvSections, type CvTargetJob } from './cv-score.ts';
import { buildSectionsFromProfile, cvFileName, parseEducation, parseExperience, refreshSectionsFromProfile } from './cv-build.ts';

const staffAdmin: CvTargetJob = {
  title: 'Staff Admin',
  requirements: [
    'Min. SMA/SMK semua jurusan',
    'Menguasai Microsoft Excel dasar (VLOOKUP, filter, pivot sederhana)',
    'Teliti dan terbiasa input data volume tinggi',
  ],
  description: 'Mengelola administrasi harian kantor, input data penjualan, mengarsipkan dokumen.',
};

function strongCv(): CvSections {
  return {
    contact: { fullName: 'Budi Santoso', email: 'budi@contoh.id', phone: '0812-3456-7890', city: 'Jakarta Selatan' },
    targetRole: 'Staff Admin',
    summary:
      'Lulusan SMK Administrasi Perkantoran yang melamar sebagai Staff Admin, dengan pengalaman magang admin 8 bulan dan terbiasa input data 300+ dokumen per hari.',
    experience: [
      {
        role: 'Magang Admin',
        company: 'CV Sinar Logistik',
        startYear: '2025',
        endYear: '2026',
        bullets: ['Menginput 300+ data pengiriman per hari', 'Mengarsipkan 1.200 dokumen secara digital'],
      },
    ],
    education: [{ institution: 'SMK Negeri 12 Jakarta', major: 'Administrasi Perkantoran', graduationYear: '2024' }],
    skills: ['Microsoft Excel', 'VLOOKUP', 'Input data', 'Arsip dokumen'],
  };
}

const ruleById = (result: ReturnType<typeof scoreCv>, id: string) =>
  result.categories.flatMap((c) => c.rules).find((r) => r.id === id)!;

test('bobot kategori berjumlah 100 dan sesuai rubrik', () => {
  const result = scoreCv({ kind: 'ats', sections: emptySections(), targetJob: null });
  const weights = Object.fromEntries(result.categories.map((c) => [c.key, c.max]));
  assert.deepEqual(weights, { kontak: 15, ringkasan: 10, pengalaman: 25, pendidikan: 10, keahlian: 20, ats: 20 });
  assert.equal(result.rulesVersion, RULES_VERSION);
});

test('CV kosong mendapat skor 0 dan setiap aturan menjelaskan alasannya', () => {
  const result = scoreCv({ kind: 'ats', sections: emptySections(), targetJob: null });
  assert.equal(result.score, 0);
  for (const r of result.categories.flatMap((c) => c.rules)) {
    assert.equal(r.earned, 0, r.id);
    assert.ok(r.message.length > 10, `alasan kosong untuk ${r.id}`);
  }
  assert.match(ruleById(result, 'ringkasan.posisi').message, /belum menyebut posisi/);
  assert.match(ruleById(result, 'ats.satu-kolom').message, /CV masih kosong/);
});

test('CV lengkap yang cocok dengan lowongan mendapat 100', () => {
  const result = scoreCv({ kind: 'ats', sections: strongCv(), targetJob: staffAdmin });
  const lost = result.categories.flatMap((c) => c.rules).filter((r) => r.earned < r.max);
  assert.deepEqual(lost.map((r) => `${r.id}: ${r.message}`), []);
  assert.equal(result.score, 100);
});

test('deterministik: input sama menghasilkan skor dan rincian yang sama', () => {
  const a = scoreCv({ kind: 'ats', sections: strongCv(), targetJob: staffAdmin });
  const b = scoreCv({ kind: 'ats', sections: structuredClone(strongCv()), targetJob: structuredClone(staffAdmin) });
  assert.deepEqual(a, b);
});

test('ringkasan yang tidak menyebut posisi target kehilangan 4 poin dengan alasan spesifik', () => {
  const cv = strongCv();
  cv.summary = 'Lulusan SMK dengan pengalaman magang delapan bulan, terbiasa bekerja teliti dan rapi dalam tim kecil yang sibuk.';
  const r = ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: staffAdmin }), 'ringkasan.posisi');
  assert.equal(r.earned, 0);
  assert.equal(r.message, 'Ringkasan belum menyebut posisi yang dituju ("Staff Admin").');
});

test('"Staf" dan "Staff" dianggap sama saat mencocokkan posisi', () => {
  const cv = strongCv();
  cv.summary = cv.summary.replace('Staff Admin', 'Staf Admin');
  assert.equal(ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: staffAdmin }), 'ringkasan.posisi').earned, 4);
});

test('panjang ringkasan di luar 80–400 karakter dikurangi', () => {
  const cv = strongCv();
  cv.summary = 'Staff Admin teliti.';
  const r = ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'ringkasan.panjang');
  assert.equal(r.earned, 0);
  assert.match(r.message, /terlalu pendek \(19 karakter/);
});

test('uraian tanpa kata kerja aksi dan tanpa angka diberi contoh perbaikan', () => {
  const cv = strongCv();
  cv.experience[0].bullets = ['Input & verifikasi data pengiriman', 'Arsip dokumen digital'];
  const result = scoreCv({ kind: 'ats', sections: cv, targetJob: staffAdmin });
  const verbs = ruleById(result, 'pengalaman.kata-kerja');
  const numbers = ruleById(result, 'pengalaman.angka');
  assert.equal(verbs.earned, 0);
  assert.match(verbs.message, /Input & verifikasi data pengiriman/);
  assert.equal(numbers.earned, 0);
});

test('satu poin berangka memberi setengah nilai angka terukur', () => {
  const cv = strongCv();
  cv.experience[0].bullets = ['Menginput 300 data per hari', 'Mengarsipkan dokumen digital'];
  assert.equal(ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'pengalaman.angka').earned, 3);
});

test('tanpa lowongan target, kata kunci tidak dinilai dan alasannya jelas', () => {
  const r = ruleById(scoreCv({ kind: 'ats', sections: strongCv(), targetJob: null }), 'keahlian.kata-kunci');
  assert.equal(r.earned, 0);
  assert.match(r.message, /Belum ada lowongan target/);
});

test('kata kunci lowongan yang hilang disebut namanya', () => {
  const cv = strongCv();
  cv.skills = ['Microsoft Excel', 'Komunikasi', 'Kerja tim'];
  const r = ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: staffAdmin }), 'keahlian.kata-kunci');
  assert.equal(r.earned, 4);
  assert.match(r.message, /VLOOKUP/);
  assert.match(r.message, /Input data/);
});

test('jumlah keahlian terlalu banyak dikurangi', () => {
  const cv = strongCv();
  cv.skills = Array.from({ length: 16 }, (_, i) => `Keahlian ${i + 1}`);
  assert.equal(ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'keahlian.jumlah').earned, 4);
});

test('pengalaman yang tidak urut dari terbaru dikurangi', () => {
  const cv = strongCv();
  cv.experience = [
    { role: 'Kasir', company: 'Toko A', startYear: '2021', endYear: '2022', bullets: [] },
    { role: 'Admin', company: 'PT B', startYear: '2023', endYear: 'sekarang', bullets: [] },
  ];
  const r = ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'ats.kronologis');
  assert.equal(r.earned, 0);
  assert.match(r.message, /belum urut/);
  cv.experience.reverse();
  assert.equal(ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'ats.kronologis').earned, 5);
});

test('emoji di isi CV dikurangi', () => {
  const cv = strongCv();
  cv.summary += ' ⭐';
  assert.equal(ruleById(scoreCv({ kind: 'ats', sections: cv, targetJob: null }), 'ats.simbol').earned, 0);
});

test('kontak tidak valid dijelaskan per kolom', () => {
  const cv = strongCv();
  cv.contact = { fullName: 'Budi', email: 'budi@', phone: '123', city: '' };
  const result = scoreCv({ kind: 'ats', sections: cv, targetJob: null });
  const kontak = result.categories.find((c) => c.key === 'kontak')!;
  assert.equal(kontak.earned, 4);
  assert.match(ruleById(result, 'kontak.email').message, /tidak valid/);
  assert.match(ruleById(result, 'kontak.kota').message, /belum diisi/);
});

test('profil diterjemahkan ke bagian CV', () => {
  assert.deepEqual(parseEducation('SMK Administrasi Perkantoran (2024)'), [
    { institution: 'SMK Administrasi Perkantoran', major: '', graduationYear: '2024' },
  ]);
  assert.deepEqual(parseExperience('Magang Admin di CV Sinar Logistik — 8 bulan'), [
    { role: 'Magang Admin', company: 'CV Sinar Logistik', startYear: '', endYear: '', bullets: [] },
  ]);
  const sections = buildSectionsFromProfile(
    {
      fullName: 'Budi Santoso', phone: '0812', emailForApplication: null, city: 'Depok',
      lastEducation: null, lastExperience: null, skills: ['Excel'], desiredRoles: 'Staff Admin, Data Entry',
    },
    'akun@contoh.id',
  );
  assert.equal(sections.contact.email, 'akun@contoh.id');
  assert.equal(sections.targetRole, 'Staff Admin');
  assert.equal(sections.summary, '');
});

test('nama berkas CV dirapikan', () => {
  assert.equal(cvFileName('Budi  Santoso', 'Staff Admin'), 'CV_Budi-Santoso_Staff-Admin.pdf');
  assert.equal(cvFileName("Siti Nur'aini Ç.", 'Admin / Kasir (Shift)'), 'CV_Siti-Nuraini-C_Admin-Kasir-Shift.pdf');
  assert.equal(cvFileName('', ''), 'CV_Pelamar.pdf');
});

test('perbarui dari profil menggabungkan keahlian dan tidak menimpa bagian yang sudah dirapikan', () => {
  const current = strongCv();
  const refreshed = refreshSectionsFromProfile(
    current,
    {
      fullName: 'Budi Santoso', phone: '0812-3456-7890', emailForApplication: 'baru@contoh.id', city: 'Depok',
      lastEducation: 'SMK (2024)', lastExperience: 'Kasir', skills: ['Excel', 'vlookup'], desiredRoles: 'Data Entry',
    },
    'akun@contoh.id',
  );
  assert.equal(refreshed.contact.city, 'Depok');
  assert.equal(refreshed.contact.email, 'baru@contoh.id');
  assert.equal(refreshed.targetRole, 'Data Entry');
  assert.deepEqual(refreshed.skills, ['Excel', 'vlookup', 'Microsoft Excel', 'Input data', 'Arsip dokumen']);
  assert.deepEqual(refreshed.education, current.education);
  assert.deepEqual(refreshed.experience, current.experience);
  assert.equal(refreshed.summary, current.summary);
});
