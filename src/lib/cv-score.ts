export const RULES_VERSION = 'v1';

export type CvKind = 'ats' | 'creative';

export type CvContact = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
};

export type CvExperience = {
  role: string;
  company: string;
  startYear: string;
  // Tahun selesai, atau 'sekarang' untuk pekerjaan yang masih berjalan.
  endYear: string;
  bullets: string[];
};

export type CvEducation = {
  institution: string;
  major: string;
  graduationYear: string;
};

export type CvSections = {
  contact: CvContact;
  targetRole: string;
  summary: string;
  experience: CvExperience[];
  education: CvEducation[];
  skills: string[];
};

export type CvTargetJob = {
  title: string;
  requirements: string[];
  description: string;
};

export type CvScoreInput = {
  kind: CvKind;
  sections: CvSections;
  targetJob: CvTargetJob | null;
};

export type CvScoreRule = {
  id: string;
  label: string;
  max: number;
  earned: number;
  message: string;
};

export type CvScoreCategoryKey = 'kontak' | 'ringkasan' | 'pengalaman' | 'pendidikan' | 'keahlian' | 'ats';

export type CvScoreCategory = {
  key: CvScoreCategoryKey;
  label: string;
  max: number;
  earned: number;
  rules: CvScoreRule[];
};

export type CvScoreResult = {
  score: number;
  rulesVersion: typeof RULES_VERSION;
  categories: CvScoreCategory[];
};

export const SUMMARY_MIN_CHARS = 80;
export const SUMMARY_MAX_CHARS = 400;
export const SKILLS_MIN = 3;
export const SKILLS_MAX = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+\-\s().]{8,20}$/;
const YEAR_RE = /^(19[5-9]\d|20\d{2})$/;
const ONGOING = new Set(['sekarang', 'saat ini', 'present', 'now']);
const DECORATIVE_RE = /[\p{Extended_Pictographic}★☆●○■□◆◇▶►✓✔✗✘❖➤]/u;

// Kata kerja aksi di awal poin uraian tugas. Daftar tertutup supaya hasilnya bisa diaudit.
export const ACTION_VERBS = new Set([
  'mengelola', 'menginput', 'melayani', 'menyusun', 'membuat', 'mengatur', 'menangani', 'memeriksa',
  'mencatat', 'merekap', 'mengantar', 'menjual', 'membantu', 'mengoordinasikan', 'mengkoordinasikan',
  'berkoordinasi', 'meningkatkan', 'menyelesaikan', 'memproses', 'menyiapkan', 'mengirim', 'mengirimkan',
  'mengarsipkan', 'memverifikasi', 'mengecek', 'menghitung', 'menata', 'mengemas', 'menyortir',
  'membalas', 'menjawab', 'melatih', 'memimpin', 'merancang', 'mengembangkan', 'menganalisis',
  'mengurangi', 'mempercepat', 'menerima', 'mendata', 'mengoperasikan', 'menjaga', 'merawat',
  'mencetak', 'mendistribusikan', 'menagih', 'mengawasi', 'memantau', 'mendaftarkan', 'mengurus',
  'menyimpan', 'menjadwalkan', 'mempresentasikan', 'menawarkan', 'mengajar', 'memperbaiki',
  'managed', 'handled', 'processed', 'prepared', 'created', 'organized', 'led', 'improved', 'reduced',
  'increased', 'served', 'coordinated', 'maintained', 'developed', 'analyzed', 'delivered', 'trained',
]);

// Kata kunci keahlian yang umum di lowongan admin, retail, gudang, F&B, operasional.
// Setiap entri: nama tampilan + alias yang dicari (dicocokkan per kata utuh, huruf kecil).
export const SKILL_KEYWORDS: { name: string; aliases: string[] }[] = [
  { name: 'Microsoft Excel', aliases: ['excel'] },
  { name: 'VLOOKUP', aliases: ['vlookup'] },
  { name: 'Pivot table', aliases: ['pivot'] },
  { name: 'Google Sheets', aliases: ['google sheets', 'spreadsheet'] },
  { name: 'Google Workspace', aliases: ['google workspace'] },
  { name: 'Microsoft Office', aliases: ['microsoft office', 'ms office'] },
  { name: 'Microsoft Word', aliases: ['microsoft word', 'ms word'] },
  { name: 'Input data', aliases: ['input data', 'data entry', 'entri data', 'menginput'] },
  { name: 'Administrasi perkantoran', aliases: ['administrasi perkantoran'] },
  { name: 'Arsip dokumen', aliases: ['arsip', 'mengarsipkan', 'pengarsipan'] },
  { name: 'Komunikasi', aliases: ['komunikasi', 'komunikatif'] },
  { name: 'Pelayanan pelanggan', aliases: ['pelayanan pelanggan', 'layanan pelanggan', 'customer service', 'melayani pelanggan'] },
  { name: 'Kasir', aliases: ['kasir'] },
  { name: 'Hitung kas', aliases: ['kas harian', 'hitung uang', 'menghitung kas'] },
  { name: 'Manajemen stok', aliases: ['stok', 'inventaris', 'stock opname', 'stok opname'] },
  { name: 'Packing & sortir', aliases: ['packing', 'sortir'] },
  { name: 'SIM B1', aliases: ['sim b1'] },
  { name: 'SIM C', aliases: ['sim c'] },
  { name: 'Mengemudi', aliases: ['mengemudi', 'menyetir'] },
  { name: 'Marketplace', aliases: ['marketplace', 'seller center', 'shopee', 'tokopedia'] },
  { name: 'Mengetik cepat', aliases: ['mengetik'] },
  { name: 'Akuntansi', aliases: ['akuntansi'] },
  { name: 'Laporan', aliases: ['laporan', 'rekap', 'merekap'] },
  { name: 'Barista', aliases: ['barista'] },
  { name: 'Rekam medis', aliases: ['rekam medis'] },
  { name: 'Ketelitian', aliases: ['teliti', 'ketelitian'] },
  { name: 'Kerja shift', aliases: ['shift'] },
];

const clean = (value: string | null | undefined): string => (value ?? '').trim();

function normalizeText(value: string): string {
  return ` ${value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bstaf\b/g, 'staff')
    .trim()} `;
}

function containsPhrase(haystackNormalized: string, phrase: string): boolean {
  const needle = normalizeText(phrase);
  return needle.trim().length > 0 && haystackNormalized.includes(needle);
}

function rule(id: string, label: string, max: number, earned: number, message: string): CvScoreRule {
  return { id, label, max, earned: Math.max(0, Math.min(max, earned)), message };
}

function category(key: CvScoreCategoryKey, label: string, rules: CvScoreRule[]): CvScoreCategory {
  return {
    key,
    label,
    max: rules.reduce((sum, r) => sum + r.max, 0),
    earned: rules.reduce((sum, r) => sum + r.earned, 0),
    rules,
  };
}

function scoreContact(contact: CvContact): CvScoreCategory {
  const name = clean(contact.fullName);
  const email = clean(contact.email);
  const phone = clean(contact.phone);
  const city = clean(contact.city);
  const phoneDigits = phone.replace(/\D/g, '').length;

  return category('kontak', 'Kelengkapan kontak', [
    rule('kontak.nama', 'Nama lengkap', 4, name.length >= 3 ? 4 : 0,
      name.length >= 3 ? 'Nama lengkap tercantum.' : 'Nama lengkap belum diisi.'),
    rule('kontak.email', 'Email', 4, EMAIL_RE.test(email) ? 4 : 0,
      !email
        ? 'Email belum diisi. HRD perlu alamat untuk membalas.'
        : EMAIL_RE.test(email)
          ? 'Email valid tercantum.'
          : `Format email "${email}" tidak valid.`),
    rule('kontak.telepon', 'Nomor telepon / WhatsApp', 4, PHONE_RE.test(phone) && phoneDigits >= 9 ? 4 : 0,
      !phone
        ? 'Nomor telepon / WhatsApp belum diisi.'
        : PHONE_RE.test(phone) && phoneDigits >= 9
          ? 'Nomor telepon tercantum.'
          : 'Nomor telepon tidak valid — minimal 9 digit, hanya angka, spasi, +, atau -.'),
    rule('kontak.kota', 'Kota domisili', 3, city ? 3 : 0,
      city ? 'Kota domisili tercantum.' : 'Kota domisili belum diisi. Banyak lowongan menyaring berdasarkan lokasi.'),
  ]);
}

function scoreSummary(summary: string, targetRole: string): CvScoreCategory {
  const text = clean(summary);
  const length = text.length;
  const target = clean(targetRole);

  if (!text) {
    return category('ringkasan', 'Ringkasan', [
      rule('ringkasan.ada', 'Ringkasan ada', 3, 0, 'Belum ada ringkasan. Tulis 2–3 kalimat tentang siapa kamu dan posisi yang dituju.'),
      rule('ringkasan.panjang', `Panjang ${SUMMARY_MIN_CHARS}–${SUMMARY_MAX_CHARS} karakter`, 3, 0, 'Panjang ringkasan belum bisa dinilai karena ringkasan kosong.'),
      rule('ringkasan.posisi', 'Menyebut posisi target', 4, 0, 'Ringkasan belum menyebut posisi yang dituju.'),
    ]);
  }

  const lengthOk = length >= SUMMARY_MIN_CHARS && length <= SUMMARY_MAX_CHARS;
  const words = normalizeText(target).trim().split(' ').filter((w) => w.length >= 3);
  const summaryNorm = normalizeText(text);
  const mentionsTarget = words.length > 0 && words.every((w) => summaryNorm.includes(` ${w} `));

  return category('ringkasan', 'Ringkasan', [
    rule('ringkasan.ada', 'Ringkasan ada', 3, 3, 'Ringkasan sudah ada.'),
    rule('ringkasan.panjang', `Panjang ${SUMMARY_MIN_CHARS}–${SUMMARY_MAX_CHARS} karakter`, 3, lengthOk ? 3 : 0,
      lengthOk
        ? `Panjang ringkasan pas (${length} karakter).`
        : length < SUMMARY_MIN_CHARS
          ? `Ringkasan terlalu pendek (${length} karakter, minimal ${SUMMARY_MIN_CHARS}). Tambahkan pengalaman atau keahlian utama.`
          : `Ringkasan terlalu panjang (${length} karakter, maksimal ${SUMMARY_MAX_CHARS}). HRD membaca ringkasan dalam hitungan detik.`),
    rule('ringkasan.posisi', 'Menyebut posisi target', 4, mentionsTarget ? 4 : 0,
      !target
        ? 'Posisi target belum ditentukan. Isi "Posisi yang dituju" atau pilih lowongan target.'
        : mentionsTarget
          ? `Ringkasan menyebut posisi yang dituju (${target}).`
          : `Ringkasan belum menyebut posisi yang dituju ("${target}").`),
  ]);
}

function firstWord(bullet: string): string {
  return bullet.trim().toLowerCase().split(/[^a-z\u00c0-\u024f]+/)[0] ?? '';
}

function scoreExperience(experience: CvExperience[]): CvScoreCategory {
  const entries = experience.filter((e) => clean(e.role) || clean(e.company) || e.bullets.some((b) => clean(b)));

  if (entries.length === 0) {
    return category('pengalaman', 'Pengalaman', [
      rule('pengalaman.ada', 'Punya pengalaman', 8, 0, 'Belum ada pengalaman. Magang, organisasi, atau kerja paruh waktu juga dihitung.'),
      rule('pengalaman.periode', 'Periode kerja terisi', 4, 0, 'Periode kerja belum bisa dinilai karena belum ada pengalaman.'),
      rule('pengalaman.kata-kerja', 'Uraian diawali kata kerja aksi', 7, 0, 'Belum ada uraian tugas.'),
      rule('pengalaman.angka', 'Pencapaian terukur dengan angka', 6, 0, 'Belum ada uraian tugas yang memakai angka.'),
    ]);
  }

  const complete = entries.filter((e) => clean(e.role) && clean(e.company));
  const hasRoleOnly = entries.some((e) => clean(e.role));
  const withYear = entries.filter((e) => YEAR_RE.test(clean(e.startYear)));
  const bullets = entries.flatMap((e) => e.bullets.map(clean).filter(Boolean));
  const actionBullets = bullets.filter((b) => ACTION_VERBS.has(firstWord(b)));
  const nonActionSample = bullets.find((b) => !ACTION_VERBS.has(firstWord(b)));
  const numericBullets = bullets.filter((b) => /\d/.test(b));

  const existsRule = complete.length > 0
    ? rule('pengalaman.ada', 'Punya pengalaman', 8, 8, `${complete.length} pengalaman lengkap dengan posisi dan tempat kerja.`)
    : rule('pengalaman.ada', 'Punya pengalaman', 8, hasRoleOnly ? 4 : 0,
      hasRoleOnly
        ? 'Nama perusahaan / tempat kerja belum diisi pada pengalaman.'
        : 'Posisi pada pengalaman belum diisi.');

  const periodEarned = withYear.length === entries.length ? 4 : withYear.length > 0 ? 2 : 0;
  const periodRule = rule('pengalaman.periode', 'Periode kerja terisi', 4, periodEarned,
    periodEarned === 4
      ? 'Tahun mulai tercantum di setiap pengalaman.'
      : `${entries.length - withYear.length} dari ${entries.length} pengalaman belum mencantumkan tahun mulai.`);

  let verbRule: CvScoreRule;
  if (bullets.length === 0) {
    verbRule = rule('pengalaman.kata-kerja', 'Uraian diawali kata kerja aksi', 7, 0,
      'Belum ada uraian tugas. Tulis 2–4 poin tentang apa yang kamu kerjakan.');
  } else if (actionBullets.length * 2 >= bullets.length) {
    verbRule = rule('pengalaman.kata-kerja', 'Uraian diawali kata kerja aksi', 7, 7,
      `${actionBullets.length} dari ${bullets.length} poin diawali kata kerja aksi.`);
  } else {
    verbRule = rule('pengalaman.kata-kerja', 'Uraian diawali kata kerja aksi', 7, actionBullets.length > 0 ? 3 : 0,
      `Baru ${actionBullets.length} dari ${bullets.length} poin diawali kata kerja aksi.` +
        (nonActionSample ? ` Contoh: ubah "${nonActionSample.slice(0, 60)}" jadi diawali kata seperti "Menginput", "Mengelola", atau "Melayani".` : ''));
  }

  let numberRule: CvScoreRule;
  if (bullets.length === 0) {
    numberRule = rule('pengalaman.angka', 'Pencapaian terukur dengan angka', 6, 0, 'Belum ada uraian tugas yang memakai angka.');
  } else if (numericBullets.length >= 2) {
    numberRule = rule('pengalaman.angka', 'Pencapaian terukur dengan angka', 6, 6,
      `${numericBullets.length} poin memakai angka terukur.`);
  } else {
    numberRule = rule('pengalaman.angka', 'Pencapaian terukur dengan angka', 6, numericBullets.length === 1 ? 3 : 0,
      numericBullets.length === 1
        ? 'Baru 1 poin yang memakai angka. Tambahkan satu lagi, mis. "Menginput 300+ data per hari".'
        : 'Belum ada poin yang memakai angka. Contoh: "Melayani 80 pelanggan per shift" lebih kuat dari "Melayani pelanggan".');
  }

  return category('pengalaman', 'Pengalaman', [existsRule, periodRule, verbRule, numberRule]);
}

function scoreEducation(education: CvEducation[]): CvScoreCategory {
  const first = education.find((e) => clean(e.institution) || clean(e.graduationYear) || clean(e.major));
  const institution = clean(first?.institution);
  const year = clean(first?.graduationYear);

  return category('pendidikan', 'Pendidikan', [
    rule('pendidikan.institusi', 'Nama institusi', 5, institution ? 5 : 0,
      institution ? `Institusi tercantum (${institution}).` : 'Nama sekolah / kampus belum diisi.'),
    rule('pendidikan.tahun', 'Tahun lulus', 5, YEAR_RE.test(year) ? 5 : 0,
      !year
        ? 'Tahun lulus belum diisi.'
        : YEAR_RE.test(year)
          ? `Tahun lulus tercantum (${year}).`
          : `Tahun lulus "${year}" tidak dikenali. Tulis empat digit, mis. 2024.`),
  ]);
}

function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills.map(clean).filter(Boolean)) {
    const key = normalizeText(skill);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result;
}

export function jobKeywords(job: CvTargetJob): string[] {
  const text = normalizeText([job.title, ...job.requirements, job.description].join(' '));
  return SKILL_KEYWORDS.filter((k) => k.aliases.some((a) => containsPhrase(text, a))).map((k) => k.name);
}

export function matchSkillsToJob(skills: string[], job: CvTargetJob): { matched: string[]; missing: string[] } {
  const jobText = normalizeText([job.title, ...job.requirements, job.description].join(' '));
  const skillsText = normalizeText(skills.join(' | '));
  const matched = new Set<string>();
  const missing: string[] = [];

  for (const keyword of SKILL_KEYWORDS) {
    if (!keyword.aliases.some((a) => containsPhrase(jobText, a))) continue;
    if (keyword.aliases.some((a) => containsPhrase(skillsText, a)) || containsPhrase(skillsText, keyword.name)) {
      matched.add(keyword.name);
    } else {
      missing.push(keyword.name);
    }
  }

  // Keahlian yang tidak ada di kamus tetapi tertulis persis di lowongan tetap dihitung cocok.
  for (const skill of skills) {
    const known = SKILL_KEYWORDS.some((k) => k.aliases.some((a) => containsPhrase(normalizeText(skill), a)));
    if (!known && containsPhrase(jobText, skill)) matched.add(skill);
  }

  return { matched: [...matched], missing };
}

function scoreSkills(skills: string[], targetJob: CvTargetJob | null): CvScoreCategory {
  const list = uniqueSkills(skills);
  const n = list.length;

  const countEarned = n >= SKILLS_MIN && n <= SKILLS_MAX ? 8 : n > 0 ? 4 : 0;
  const countRule = rule('keahlian.jumlah', `Jumlah keahlian ${SKILLS_MIN}–${SKILLS_MAX}`, 8, countEarned,
    n === 0
      ? 'Belum ada keahlian yang dicantumkan.'
      : n < SKILLS_MIN
        ? `Baru ${n} keahlian. Cantumkan minimal ${SKILLS_MIN} yang benar-benar kamu kuasai.`
        : n > SKILLS_MAX
          ? `${n} keahlian terlalu banyak — HRD sulit menangkap yang utama. Pilih maksimal ${SKILLS_MAX}.`
          : `${n} keahlian tercantum.`);

  let matchRule: CvScoreRule;
  if (!targetJob) {
    matchRule = rule('keahlian.kata-kunci', 'Cocok dengan kata kunci lowongan target', 12, 0,
      'Belum ada lowongan target, jadi kata kunci tidak bisa dicocokkan. Pilih satu lowongan target.');
  } else if (n === 0) {
    const needed = jobKeywords(targetJob);
    matchRule = rule('keahlian.kata-kunci', 'Cocok dengan kata kunci lowongan target', 12, 0,
      `Belum ada keahlian untuk dicocokkan dengan lowongan "${targetJob.title}".` +
        (needed.length ? ` Lowongan ini menyebut: ${needed.slice(0, 5).join(', ')}.` : ''));
  } else {
    const { matched, missing } = matchSkillsToJob(list, targetJob);
    const earned = matched.length >= 3 ? 12 : matched.length === 2 ? 8 : matched.length === 1 ? 4 : 0;
    const missingText = missing.length
      ? ` Dicari lowongan ini tapi belum ada di CV: ${missing.slice(0, 5).join(', ')}.`
      : '';
    matchRule = rule('keahlian.kata-kunci', 'Cocok dengan kata kunci lowongan target', 12, earned,
      matched.length === 0
        ? `Belum ada keahlian yang cocok dengan kata kunci lowongan "${targetJob.title}".${missingText}`
        : earned === 12
          ? `${matched.length} keahlian cocok dengan lowongan "${targetJob.title}": ${matched.slice(0, 5).join(', ')}.`
          : `Baru ${matched.length} keahlian cocok dengan lowongan "${targetJob.title}" (${matched.join(', ')}); butuh 3 untuk nilai penuh.${missingText}`);
  }

  return category('keahlian', 'Keahlian', [countRule, matchRule]);
}

function yearValue(raw: string): number | null {
  const value = clean(raw).toLowerCase();
  if (ONGOING.has(value)) return Number.POSITIVE_INFINITY;
  return YEAR_RE.test(value) ? Number(value) : null;
}

function scoreAts(input: CvScoreInput, isEmpty: boolean): CvScoreCategory {
  const { sections, kind } = input;
  const label = 'Keterbacaan ATS';

  if (isEmpty) {
    const reason = 'CV masih kosong — belum ada isi yang bisa dibaca mesin ATS.';
    return category('ats', label, [
      rule('ats.satu-kolom', 'Tata letak satu kolom', 5, 0, reason),
      rule('ats.tanpa-tabel', 'Tanpa tabel, gambar, atau ikon', 4, 0, reason),
      rule('ats.heading', 'Judul bagian standar', 3, 0, reason),
      rule('ats.simbol', 'Tanpa emoji atau simbol dekoratif', 3, 0, reason),
      rule('ats.kronologis', 'Pengalaman urut dari yang terbaru', 5, 0, reason),
    ]);
  }

  const isAts = kind === 'ats';
  const allText = [
    sections.summary,
    sections.targetRole,
    ...sections.skills,
    ...sections.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...sections.education.flatMap((e) => [e.institution, e.major]),
  ].join(' ');
  const hasDecorative = DECORATIVE_RE.test(allText);

  const entries = sections.experience.filter((e) => clean(e.role) || clean(e.company));
  const keys = entries.map((e) => ({ end: yearValue(e.endYear) ?? yearValue(e.startYear), start: yearValue(e.startYear) }));
  const missingYears = keys.some((k) => k.end === null);
  let ordered = true;
  for (let i = 1; i < keys.length; i += 1) {
    const prev = keys[i - 1];
    const cur = keys[i];
    if (prev.end === null || cur.end === null) continue;
    if (cur.end > prev.end || (cur.end === prev.end && (cur.start ?? 0) > (prev.start ?? 0))) ordered = false;
  }

  let chronoRule: CvScoreRule;
  // Satu pengalaman tanpa tahun sudah dikurangi di "Periode kerja terisi"; jangan dihukum dua kali.
  if (entries.length <= 1) {
    chronoRule = rule('ats.kronologis', 'Pengalaman urut dari yang terbaru', 5, 5,
      entries.length === 0 ? 'Tidak ada pengalaman yang perlu diurutkan.' : 'Hanya satu pengalaman, urutan tidak jadi masalah.');
  } else if (missingYears) {
    chronoRule = rule('ats.kronologis', 'Pengalaman urut dari yang terbaru', 5, 0,
      'Ada pengalaman tanpa tahun, jadi urutannya tidak bisa diperiksa. Isi tahun mulai dan selesai.');
  } else {
    chronoRule = rule('ats.kronologis', 'Pengalaman urut dari yang terbaru', 5, ordered ? 5 : 0,
      ordered ? 'Pengalaman sudah urut dari yang terbaru.' : 'Pengalaman belum urut dari yang terbaru. Pindahkan pengalaman terakhir ke paling atas.');
  }

  const templateMsg = 'Dijamin oleh template CV ATS RuangLoker.';
  const creativeMsg = 'Template kreatif memakai tata letak visual yang bisa membingungkan ATS.';

  return category('ats', label, [
    rule('ats.satu-kolom', 'Tata letak satu kolom', 5, isAts ? 5 : 0, isAts ? `Satu kolom. ${templateMsg}` : creativeMsg),
    rule('ats.tanpa-tabel', 'Tanpa tabel, gambar, atau ikon', 4, isAts ? 4 : 0, isAts ? `Tanpa tabel, gambar, atau ikon. ${templateMsg}` : creativeMsg),
    rule('ats.heading', 'Judul bagian standar', 3, isAts ? 3 : 0,
      isAts ? 'Judul bagian memakai nama standar: Ringkasan, Pengalaman, Keahlian, Pendidikan.' : creativeMsg),
    rule('ats.simbol', 'Tanpa emoji atau simbol dekoratif', 3, hasDecorative ? 0 : 3,
      hasDecorative ? 'Ada emoji atau simbol dekoratif di isi CV. ATS sering membacanya sebagai karakter rusak.' : 'Tidak ada emoji atau simbol dekoratif.'),
    chronoRule,
  ]);
}

export function isCvEmpty(sections: CvSections): boolean {
  return (
    !clean(sections.summary) &&
    sections.skills.every((s) => !clean(s)) &&
    sections.experience.every((e) => !clean(e.role) && !clean(e.company) && e.bullets.every((b) => !clean(b))) &&
    sections.education.every((e) => !clean(e.institution) && !clean(e.major) && !clean(e.graduationYear))
  );
}

export function scoreCv(input: CvScoreInput): CvScoreResult {
  const { sections, targetJob } = input;
  const targetRole = clean(targetJob?.title) || clean(sections.targetRole);

  const categories = [
    scoreContact(sections.contact),
    scoreSummary(sections.summary, targetRole),
    scoreExperience(sections.experience),
    scoreEducation(sections.education),
    scoreSkills(sections.skills, targetJob),
    scoreAts(input, isCvEmpty(sections)),
  ];

  return {
    score: categories.reduce((sum, c) => sum + c.earned, 0),
    rulesVersion: RULES_VERSION,
    categories,
  };
}

export function scoreVerdict(score: number): string {
  if (score >= 85) return 'Siap dikirim. Perbaikan yang tersisa, jika ada, bersifat opsional.';
  if (score >= 70) return 'Cukup bagus. Beberapa perbaikan kecil akan membuat CV lebih lengkap.';
  if (score >= 50) return 'Perlu beberapa perbaikan sebelum dikirim.';
  return 'Masih banyak bagian kosong. Mulai dari yang poinnya paling besar.';
}

export function emptySections(): CvSections {
  return {
    contact: { fullName: '', email: '', phone: '', city: '' },
    targetRole: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
}
