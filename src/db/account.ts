import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './index';
import { files, profiles, consents, users } from './schema';
import type { Profile, VaultFile } from './schema';

export type ProfileFieldKey =
  | 'fullName'
  | 'phone'
  | 'emailForApplication'
  | 'city'
  | 'maxRadiusKm'
  | 'lastEducation'
  | 'lastExperience'
  | 'skills'
  | 'desiredRoles'
  | 'expectedSalary'
  | 'availability';

const COMPLETENESS_FIELDS: ProfileFieldKey[] = [
  'fullName',
  'phone',
  'city',
  'lastEducation',
  'lastExperience',
  'skills',
  'desiredRoles',
];

export async function getProfile(userId: number): Promise<Profile | null> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function saveProfile(
  userId: number,
  input: Record<string, string | number | string[] | null>,
): Promise<void> {
  await db
    .update(profiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));
}

export function profileCompleteness(profile: Profile | null): {
  percent: number;
  missing: ProfileFieldKey[];
} {
  if (!profile) return { percent: 0, missing: [...COMPLETENESS_FIELDS] };

  const missing = COMPLETENESS_FIELDS.filter((key) => {
    const value = profile[key];
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || String(value).trim() === '';
  });

  const filled = COMPLETENESS_FIELDS.length - missing.length;
  return {
    percent: Math.round((filled / COMPLETENESS_FIELDS.length) * 100),
    missing,
  };
}

export async function listFiles(userId: number): Promise<VaultFile[]> {
  return db
    .select()
    .from(files)
    .where(and(eq(files.userId, userId), isNull(files.deletedAt)))
    .orderBy(files.kind);
}

export async function getFile(userId: number, fileId: number): Promise<VaultFile | null> {
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId), isNull(files.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export function storageUsed(filesList: VaultFile[]): number {
  return filesList.reduce((sum, f) => sum + f.sizeBytes, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function hasSensitiveConsent(userId: number): Promise<boolean> {
  const rows = await db
    .select({ id: consents.id })
    .from(consents)
    .where(and(eq(consents.userId, userId), eq(consents.type, 'data_sensitif'), isNull(consents.revokedAt)))
    .limit(1);

  return rows.length > 0;
}

export async function getAccountOverview(userId: number) {
  const [profile, filesList] = await Promise.all([getProfile(userId), listFiles(userId)]);

  const counts = await db
    .select({ n: sql<number>`count(*)` })
    .from(files)
    .where(and(eq(files.userId, userId), isNull(files.deletedAt)));

  return {
    profile,
    completeness: profileCompleteness(profile),
    files: filesList,
    fileCount: counts[0]?.n ?? 0,
    bytesUsed: storageUsed(filesList),
  };
}

export async function emailTaken(email: string, exceptUserId: number): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), isNull(users.deletedAt)))
    .limit(1);

  return rows.length > 0 && rows[0].id !== exceptUserId;
}
