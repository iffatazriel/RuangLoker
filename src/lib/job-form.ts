import { normalizeWaNumber } from './letter.ts';

export const MAX_LISTING_DAYS = 30;
export const JOB_CATEGORIES = ['Admin', 'Retail', 'Gudang', 'F&B', 'Operasional'] as const;
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Shift', 'Kontrak', 'Hybrid', 'Magang'] as const;
export const APPLY_CHANNELS = ['Email', 'WhatsApp', 'Google Form', 'Portal Eksternal'] as const;
export const JOB_STATUSES = ['pending', 'verified', 'manual_checked', 'rejected'] as const;

// Titik tengah kota untuk pencarian radius kalau koordinat kantor tidak diisi.
export const CITY_COORDS: Record<string, { province: string; lat: number; lng: number }> = {
  'Jakarta Pusat': { province: 'DKI Jakarta', lat: -6.1865, lng: 106.8343 },
  'Jakarta Selatan': { province: 'DKI Jakarta', lat: -6.2615, lng: 106.8106 },
  'Jakarta Timur': { province: 'DKI Jakarta', lat: -6.225, lng: 106.9004 },
  'Jakarta Barat': { province: 'DKI Jakarta', lat: -6.1683, lng: 106.7589 },
  'Jakarta Utara': { province: 'DKI Jakarta', lat: -6.1384, lng: 106.8636 },
  Bogor: { province: 'Jawa Barat', lat: -6.5971, lng: 106.806 },
  Depok: { province: 'Jawa Barat', lat: -6.4025, lng: 106.7942 },
  Bekasi: { province: 'Jawa Barat', lat: -6.2383, lng: 106.9756 },
  Tangerang: { province: 'Banten', lat: -6.1783, lng: 106.6319 },
  'Tangerang Selatan': { province: 'Banten', lat: -6.2886, lng: 106.7179 },
};

export type JobFormValues = {
  title: string;
  company: string;
  category: string;
  employmentType: string;
  city: string;
  district: string;
  lat: string;
  lng: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  applyChannel: string;
  applyTarget: string;
  sourceName: string;
  sourceUrl: string;
  expiresAt: string;
  verificationStatus: string;
  isDirectEmployer: boolean;
};

export type JobRecord = {
  title: string;
  company: string;
  companyInitials: string;
  category: string;
  employmentType: string;
  city: string;
  province: string;
  district: string | null;
  lat: number;
  lng: number;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string[];
  applyChannel: string;
  applyTarget: string;
  sourceName: string;
  sourceUrl: string | null;
  expiresAt: Date;
  verificationStatus: string;
  isDirectEmployer: boolean;
};

const FIELDS: (keyof JobFormValues)[] = [
  'title', 'company', 'category', 'employmentType', 'city', 'district', 'lat', 'lng', 'salaryMin', 'salaryMax',
  'description', 'requirements', 'applyChannel', 'applyTarget', 'sourceName', 'sourceUrl', 'expiresAt', 'verificationStatus',
];

export function readJobForm(form: FormData): JobFormValues {
  const out = { isDirectEmployer: form.get('isDirectEmployer') === 'on' } as JobFormValues;
  for (const f of FIELDS) (out as Record<string, unknown>)[f] = String(form.get(f) ?? '').trim();
  return out;
}

export function companyInitials(company: string): string {
  const words = company
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(PT|CV|UD|Tbk)\.?\s+/i, '')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w));
  const letters = words.slice(0, 2).map((w) => w.replace(/[^A-Za-z0-9]/g, '')[0] ?? '').join('');
  return (letters || company.slice(0, 2)).toUpperCase();
}

export function jobSlug(title: string, company: string, suffix: string): string {
  const base = `${title} ${company}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
  return `${base || 'lowongan'}-${suffix}`;
}

const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const rupiahInt = (v: string): number | null | undefined => {
  if (!v) return null;
  const n = Number(v.replace(/[.\s]/g, ''));
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000_000 ? n : undefined;
};

export function validateJobForm(
  v: JobFormValues,
  now: Date,
): { ok: true; record: JobRecord } | { ok: false; errors: Partial<Record<keyof JobFormValues, string>> } {
  const errors: Partial<Record<keyof JobFormValues, string>> = {};

  if (v.title.length < 3 || v.title.length > 120) errors.title = 'Posisi 3–120 karakter.';
  if (v.company.length < 2 || v.company.length > 120) errors.company = 'Nama perusahaan 2–120 karakter.';
  if (!(JOB_CATEGORIES as readonly string[]).includes(v.category)) errors.category = 'Pilih kategori.';
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(v.employmentType)) errors.employmentType = 'Pilih jenis kerja.';
  const city = CITY_COORDS[v.city];
  if (!city) errors.city = 'Pilih kota.';
  if (v.description.length < 40) errors.description = 'Deskripsi minimal 40 karakter.';
  if (v.sourceName.length < 3) errors.sourceName = 'Sebutkan sumber lowongan.';
  if (v.sourceUrl && !isHttpUrl(v.sourceUrl)) errors.sourceUrl = 'URL sumber harus diawali http(s)://.';
  if (!(JOB_STATUSES as readonly string[]).includes(v.verificationStatus)) errors.verificationStatus = 'Pilih status.';

  let lat = city?.lat ?? 0;
  let lng = city?.lng ?? 0;
  if (v.lat || v.lng) {
    const la = Number(v.lat);
    const ln = Number(v.lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -11 || la > 6 || ln < 94 || ln > 142) {
      errors.lat = 'Koordinat harus di wilayah Indonesia, atau kosongkan keduanya.';
    } else {
      lat = la;
      lng = ln;
    }
  }

  const salaryMin = rupiahInt(v.salaryMin);
  const salaryMax = rupiahInt(v.salaryMax);
  if (salaryMin === undefined) errors.salaryMin = 'Gaji harus angka rupiah.';
  if (salaryMax === undefined) errors.salaryMax = 'Gaji harus angka rupiah.';
  if (salaryMin && salaryMax && salaryMin > salaryMax) errors.salaryMax = 'Gaji maksimum lebih kecil dari minimum.';

  let applyTarget = v.applyTarget;
  if (v.applyChannel === 'Email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(applyTarget)) errors.applyTarget = 'Email lamaran tidak valid.';
  } else if (v.applyChannel === 'WhatsApp') {
    applyTarget = normalizeWaNumber(applyTarget);
    if (!applyTarget) errors.applyTarget = 'Nomor WhatsApp tidak valid (contoh 0812xxxx).';
  } else if (v.applyChannel === 'Google Form' || v.applyChannel === 'Portal Eksternal') {
    if (!isHttpUrl(applyTarget)) errors.applyTarget = 'Tautan harus diawali http(s)://.';
  } else {
    errors.applyChannel = 'Pilih jalur lamar.';
  }

  const expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(v.expiresAt) ? new Date(`${v.expiresAt}T23:59:59+07:00`) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) errors.expiresAt = 'Isi batas tayang.';
  else if (expiresAt.getTime() <= now.getTime()) errors.expiresAt = 'Batas tayang harus di masa depan.';
  else if (expiresAt.getTime() > now.getTime() + (MAX_LISTING_DAYS + 1) * 86_400_000)
    errors.expiresAt = `Maksimal ${MAX_LISTING_DAYS} hari dari hari ini. Perpanjang lewat panel kurasi kalau masih dibuka.`;

  const requirements = v.requirements
    .split('\n')
    .map((r) => r.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 20);
  if (requirements.length === 0) errors.requirements = 'Isi minimal satu persyaratan, satu per baris.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    record: {
      title: v.title,
      company: v.company,
      companyInitials: companyInitials(v.company),
      category: v.category,
      employmentType: v.employmentType,
      city: v.city,
      province: city!.province,
      district: v.district || null,
      lat,
      lng,
      salaryMin: salaryMin ?? null,
      salaryMax: salaryMax ?? null,
      description: v.description,
      requirements,
      applyChannel: v.applyChannel,
      applyTarget,
      sourceName: v.sourceName,
      sourceUrl: v.sourceUrl || null,
      expiresAt: expiresAt!,
      verificationStatus: v.verificationStatus,
      isDirectEmployer: v.isDirectEmployer,
    },
  };
}

export function jobToFormValues(job: Omit<JobRecord, 'companyInitials' | 'province' | 'expiresAt'> & { expiresAt: Date | null }): JobFormValues {
  const wib = job.expiresAt ? new Date(job.expiresAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : '';
  const center = CITY_COORDS[job.city];
  const custom = !center || center.lat !== job.lat || center.lng !== job.lng;
  return {
    title: job.title,
    company: job.company,
    category: job.category,
    employmentType: job.employmentType,
    city: job.city,
    district: job.district ?? '',
    lat: custom ? String(job.lat) : '',
    lng: custom ? String(job.lng) : '',
    salaryMin: job.salaryMin ? String(job.salaryMin) : '',
    salaryMax: job.salaryMax ? String(job.salaryMax) : '',
    description: job.description,
    requirements: job.requirements.join('\n'),
    applyChannel: job.applyChannel,
    applyTarget: job.applyTarget,
    sourceName: job.sourceName,
    sourceUrl: job.sourceUrl ?? '',
    expiresAt: wib,
    verificationStatus: job.verificationStatus,
    isDirectEmployer: job.isDirectEmployer,
  };
}

export function emptyJobForm(now: Date): JobFormValues {
  const in30 = new Date(now.getTime() + MAX_LISTING_DAYS * 86_400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  return {
    title: '', company: '', category: 'Admin', employmentType: 'Full-time', city: 'Jakarta Selatan', district: '',
    lat: '', lng: '', salaryMin: '', salaryMax: '', description: '', requirements: '', applyChannel: 'Email',
    applyTarget: '', sourceName: '', sourceUrl: '', expiresAt: in30, verificationStatus: 'verified', isDirectEmployer: false,
  };
}
