// Penyusun surat lamaran dan pesan kirim. Murni dan deterministik: input sama, teks sama.

export type LetterTemplate = 'formal' | 'fresh' | 'retail';
export type LetterTone = 'formal' | 'semi';

export const TEMPLATES: Record<LetterTemplate, { label: string; hint: string }> = {
  formal: { label: 'Formal', hint: 'Untuk perusahaan dan instansi' },
  fresh: { label: 'Fresh graduate', hint: 'Menonjolkan pendidikan, magang, dan organisasi' },
  retail: { label: 'Retail / operasional', hint: 'Singkat dan langsung' },
};

export const TONES: Record<LetterTone, string> = { formal: 'Formal', semi: 'Semi-formal' };

export const CV_LINK_PLACEHOLDER = '[link CV]';
// Tautan compose Gmail memotong isi sekitar 2.000 karakter setelah di-encode.
export const GMAIL_URL_LIMIT = 2000;

export type LetterApplicant = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  education: string;
  experience: string;
  skills: string[];
};

export type LetterJob = {
  title: string;
  company: string;
  city: string;
  channel: string;
  requirements: string[];
};

export type LetterInput = {
  applicant: LetterApplicant;
  job: LetterJob;
  template: LetterTemplate;
  tone: LetterTone;
  date: Date;
};

const clean = (v: string) => v.replace(/\s+/g, ' ').trim();

export function isLetterTemplate(v: unknown): v is LetterTemplate {
  return v === 'formal' || v === 'fresh' || v === 'retail';
}

export function isLetterTone(v: unknown): v is LetterTone {
  return v === 'formal' || v === 'semi';
}

export function formatLetterDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
}

// Keahlian yang juga disebut lowongan didahulukan, maksimal tiga.
export function pickSkills(skills: string[], requirements: string[]): string[] {
  const req = requirements.join(' ').toLowerCase();
  const list = skills.map(clean).filter(Boolean);
  const matched = list.filter((s) => req.includes(s.toLowerCase()));
  const rest = list.filter((s) => !matched.includes(s));
  return [...matched, ...rest].slice(0, 3);
}

export function joinId(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} dan ${items.at(-1)}`;
}

export function letterSubject(job: LetterJob, applicant: LetterApplicant): string {
  const name = clean(applicant.fullName) || 'Pelamar';
  return `Lamaran ${clean(job.title)} — ${name}`;
}

function signature(a: LetterApplicant, tone: LetterTone): string {
  const contact = [clean(a.phone), clean(a.email)].filter(Boolean).join(' · ');
  return [tone === 'formal' ? 'Hormat saya,' : 'Salam,', clean(a.fullName) || 'Pelamar', contact].filter(Boolean).join('\n');
}

function introSentence(input: LetterInput): string {
  const { applicant: a, job } = input;
  const name = clean(a.fullName) || 'saya';
  const edu = clean(a.education);
  const exp = clean(a.experience);
  const skills = joinId(pickSkills(a.skills, job.requirements));

  const parts: string[] = [];
  if (input.template === 'fresh') {
    parts.push(edu ? `Saya, ${name}, lulusan ${edu}.` : `Saya ${name}.`);
    if (exp) parts.push(`Selama ini saya memiliki pengalaman ${exp}.`);
  } else if (input.template === 'retail') {
    parts.push(exp ? `Saya ${name}, berpengalaman ${exp}.` : `Saya ${name}${edu ? `, lulusan ${edu}` : ''}.`);
  } else {
    const bits = [edu && `lulusan ${edu}`, exp && `dengan pengalaman ${exp}`].filter(Boolean).join(' ');
    parts.push(`Saya, ${name}${bits ? `, ${bits}` : ''}.`);
  }
  if (skills) parts.push(`Saya terbiasa dengan ${skills}.`);
  return parts.join(' ');
}

export function buildEmailLetter(input: LetterInput): string {
  const { job, tone, template } = input;
  const greet = tone === 'formal' ? 'Dengan hormat,' : 'Halo Tim Rekrutmen,';
  const header = [
    `${clean(input.applicant.city) || 'Jakarta'}, ${formatLetterDate(input.date)}`,
    '',
    'Kepada Yth.',
    `Tim Rekrutmen ${clean(job.company)}`,
    `di ${clean(job.city)}`,
  ];

  const opening =
    template === 'retail'
      ? `Saya ingin melamar posisi ${clean(job.title)} di ${clean(job.company)}.`
      : `Berdasarkan informasi lowongan yang saya terima, saya bermaksud melamar posisi ${clean(job.title)} di ${clean(job.company)}.`;

  const closing =
    template === 'retail'
      ? 'CV saya lampirkan. Saya siap mengikuti wawancara kapan saja.'
      : 'Sebagai bahan pertimbangan, saya lampirkan CV saya. Besar harapan saya untuk dapat mengikuti tahap seleksi berikutnya.';

  const thanks = tone === 'formal' ? 'Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.' : 'Terima kasih atas waktunya.';

  return [...header, '', greet, '', opening, introSentence(input), '', closing, thanks, '', signature(input.applicant, tone)].join('\n');
}

export function buildWhatsAppMessage(input: LetterInput): string {
  const { job, tone } = input;
  const greet = tone === 'formal' ? `Selamat pagi/siang, Bapak/Ibu Tim Rekrutmen ${clean(job.company)}.` : `Halo, Tim Rekrutmen ${clean(job.company)}.`;
  return [
    greet,
    '',
    `Saya ingin melamar posisi ${clean(job.title)}. ${introSentence(input)}`,
    '',
    `CV saya bisa dibuka di: ${CV_LINK_PLACEHOLDER}`,
    '',
    tone === 'formal' ? 'Terima kasih atas perhatian Bapak/Ibu.' : 'Terima kasih.',
    clean(input.applicant.fullName),
  ].join('\n');
}

export function buildFormSummary(input: LetterInput): string {
  const a = input.applicant;
  return [
    `Nama: ${clean(a.fullName)}`,
    `Email: ${clean(a.email)}`,
    `WhatsApp: ${clean(a.phone)}`,
    `Domisili: ${clean(a.city)}`,
    `Pendidikan: ${clean(a.education) || '-'}`,
    `Pengalaman: ${clean(a.experience) || '-'}`,
    `Keahlian: ${a.skills.map(clean).filter(Boolean).join(', ') || '-'}`,
    '',
    `Motivasi: ${introSentence(input)}`,
  ].join('\n');
}

export function buildApplication(input: LetterInput): { subject: string; body: string } {
  const subject = letterSubject(input.job, input.applicant);
  if (input.job.channel === 'WhatsApp') return { subject, body: buildWhatsAppMessage(input) };
  if (input.job.channel === 'Email') return { subject, body: buildEmailLetter(input) };
  return { subject, body: buildFormSummary(input) };
}

export function letterFileName(fullName: string, role: string): string {
  const part = (v: string) =>
    clean(v)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return `Surat-Lamaran_${part(fullName) || 'Pelamar'}_${part(role) || 'Posisi'}.pdf`;
}

// 08xx / +62xx / 62xx → 62xx. Nomor tidak valid menghasilkan string kosong.
export function normalizeWaNumber(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (digits.startsWith('8')) digits = `62${digits}`;
  return /^62\d{8,13}$/.test(digits) ? digits : '';
}

export function waUrl(phone: string, text: string): string {
  const n = normalizeWaNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '';
}

export function gmailComposeUrl(to: string, subject: string, body: string): { url: string; truncated: boolean } {
  const base = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=`;
  const full = base + encodeURIComponent(body);
  if (full.length <= GMAIL_URL_LIMIT) return { url: full, truncated: false };
  let cut = body;
  while (cut.length && (base + encodeURIComponent(cut)).length > GMAIL_URL_LIMIT) cut = cut.slice(0, -20);
  return { url: base + encodeURIComponent(cut), truncated: true };
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
