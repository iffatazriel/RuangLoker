import type { Profile } from '../db/schema';
import { emptySections, type CvExperience, type CvSections } from './cv-score.ts';

type ProfileSource = Pick<
  Profile,
  'fullName' | 'phone' | 'emailForApplication' | 'city' | 'lastEducation' | 'lastExperience' | 'skills' | 'desiredRoles'
>;

const YEAR_GLOBAL_RE = /\b(19[5-9]\d|20\d{2})\b/g;

export function parseEducation(raw: string | null): CvSections['education'] {
  const text = (raw ?? '').trim();
  if (!text) return [];

  const years = text.match(YEAR_GLOBAL_RE) ?? [];
  const institution = text
    .replace(YEAR_GLOBAL_RE, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[\s,–—-]+$/, '')
    .trim();

  return [{ institution, major: '', graduationYear: years.at(-1) ?? '' }];
}

export function parseExperience(raw: string | null): CvExperience[] {
  const text = (raw ?? '').trim();
  if (!text) return [];

  const years = text.match(YEAR_GLOBAL_RE) ?? [];
  // "Magang Admin di CV Sinar Logistik — 8 bulan": bagian setelah tanda pisah adalah durasi.
  const main = text.split(/\s+[—–-]\s+/)[0].replace(YEAR_GLOBAL_RE, '').replace(/\(\s*\)/g, '').trim();
  const [role, company = ''] = main.split(/\s+(?:di|at|@)\s+/i);

  return [
    {
      role: role.trim(),
      company: company.trim(),
      startYear: years[0] ?? '',
      endYear: years[1] ?? '',
      bullets: [],
    },
  ];
}

export function firstDesiredRole(desiredRoles: string | null): string {
  return (desiredRoles ?? '').split(/[,;/]/)[0]?.trim() ?? '';
}

export function contactFromProfile(profile: ProfileSource | null, accountEmail: string): CvSections['contact'] {
  return {
    fullName: profile?.fullName?.trim() ?? '',
    email: profile?.emailForApplication?.trim() || accountEmail,
    phone: profile?.phone?.trim() ?? '',
    city: profile?.city?.trim() ?? '',
  };
}

export function buildSectionsFromProfile(profile: ProfileSource | null, accountEmail: string): CvSections {
  const base = emptySections();
  if (!profile) return { ...base, contact: contactFromProfile(null, accountEmail) };

  return {
    ...base,
    contact: contactFromProfile(profile, accountEmail),
    targetRole: firstDesiredRole(profile.desiredRoles),
    experience: parseExperience(profile.lastExperience),
    education: parseEducation(profile.lastEducation),
    skills: [...(profile.skills ?? [])],
  };
}

// Kontak, posisi, dan keahlian diambil ulang dari profil. Ringkasan, pengalaman, dan pendidikan
// yang sudah dirapikan di halaman CV tidak ditimpa, karena di profil bentuknya hanya teks bebas.
export function refreshSectionsFromProfile(
  current: CvSections,
  profile: ProfileSource | null,
  accountEmail: string,
): CvSections {
  const fresh = buildSectionsFromProfile(profile, accountEmail);
  return {
    ...current,
    contact: fresh.contact,
    targetRole: fresh.targetRole || current.targetRole,
    skills: fresh.skills.length ? fresh.skills : current.skills,
    education: current.education.length ? current.education : fresh.education,
    experience: current.experience.length ? current.experience : fresh.experience,
  };
}

function fileSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cvFileName(fullName: string, role: string): string {
  const name = fileSlug(fullName) || 'Pelamar';
  const position = fileSlug(role);
  return position ? `CV_${name}_${position}.pdf` : `CV_${name}.pdf`;
}
