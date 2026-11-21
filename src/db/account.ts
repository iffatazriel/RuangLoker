import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './index';
import { files, profiles, consents, users } from './schema';
import type { Profile, VaultFile } from './schema';
import { FILE_KINDS, purgeFile, sealFile, storedNameFor } from '../lib/vault';

export const FREE_QUOTA_BYTES = 50 * 1024 * 1024;

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

export type StoreFileResult = { ok: true; file: VaultFile } | { ok: false; reason: 'kuota' };

// Satu slot per jenis berkas: unggahan baru menggantikan yang lama,
// bukan menumpuk. Tanpa ini brankas bisa berisi lima versi CV.
export async function storeFileReplacingKind(
  userId: number,
  input: { kind: string; originalName: string; mimeType: string; extension: string; data: Buffer },
): Promise<StoreFileResult> {
  const meta = FILE_KINDS[input.kind];
  const existing = await listFiles(userId);
  const usedAfterReplace = storageUsed(existing.filter((f) => f.kind !== input.kind));

  if (usedAfterReplace + input.data.length > FREE_QUOTA_BYTES) {
    return { ok: false, reason: 'kuota' };
  }

  const storedName = storedNameFor(input.extension);
  const sealed = await sealFile(userId, storedName, input.data);

  for (const old of existing.filter((f) => f.kind === input.kind)) {
    await purgeFile(userId, old.storedName);
    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(and(eq(files.id, old.id), eq(files.userId, userId)));
  }

  const [file] = await db
    .insert(files)
    .values({
      userId,
      kind: input.kind,
      label: meta.label,
      originalName: input.originalName.slice(0, 200),
      storedName,
      mimeType: input.mimeType,
      sizeBytes: sealed.sizeBytes,
      iv: sealed.iv,
      authTag: sealed.authTag,
      sha256: sealed.sha256,
      isSensitive: meta.sensitive,
      isPrimary: true,
    })
    .returning();

  return { ok: true, file };
}
