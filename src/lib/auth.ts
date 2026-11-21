import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { auditLog, consents, profiles, users } from '../db/schema';
import type { User } from '../db/schema';

export const CONSENT_VERSIONS = {
  akun: '2026-11-v1',
  data_sensitif: '2026-11-v1',
  pemasaran: '2026-11-v1',
} as const;

export type ConsentType = keyof typeof CONSENT_VERSIONS;

export type ConsentInput = Partial<Record<ConsentType, boolean>>;

export async function recordConsents(
  userId: number,
  input: ConsentInput,
  evidence: string,
): Promise<void> {
  const now = new Date();

  for (const [type, granted] of Object.entries(input) as [ConsentType, boolean | undefined][]) {
    if (!granted) continue;

    const existing = await db
      .select({ id: consents.id })
      .from(consents)
      .where(
        and(
          eq(consents.userId, userId),
          eq(consents.type, type),
          isNull(consents.revokedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(consents).values({
      userId,
      type,
      version: CONSENT_VERSIONS[type],
      evidence,
      grantedAt: now,
    });
  }
}

export async function hasConsent(userId: number, type: ConsentType): Promise<boolean> {
  const rows = await db
    .select({ id: consents.id })
    .from(consents)
    .where(and(eq(consents.userId, userId), eq(consents.type, type), isNull(consents.revokedAt)))
    .limit(1);

  return rows.length > 0;
}

export async function getConsentState(userId: number) {
  const rows = await db
    .select({
      type: consents.type,
      version: consents.version,
      grantedAt: consents.grantedAt,
    })
    .from(consents)
    .where(and(eq(consents.userId, userId), isNull(consents.revokedAt)));

  const byType = new Map(rows.map((r) => [r.type as ConsentType, r]));

  return {
    akun: byType.get('akun') ?? null,
    data_sensitif: byType.get('data_sensitif') ?? null,
    pemasaran: byType.get('pemasaran') ?? null,
  };
}

export async function revokeConsent(userId: number, type: ConsentType): Promise<void> {
  await db
    .update(consents)
    .set({ revokedAt: new Date() })
    .where(and(eq(consents.userId, userId), eq(consents.type, type), isNull(consents.revokedAt)));

  await logAudit(userId, 'consent.revoke', type);
}

export async function createUser(
  email: string,
  passwordHash: string,
  displayName: string,
): Promise<User> {
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .insert(users)
    .values({ email: normalized, passwordHash, displayName: displayName.trim() })
    .returning();

  await db.insert(profiles).values({ userId: row.id }).onConflictDoNothing();

  return row;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function touchLogin(userId: number): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

export async function logAudit(
  userId: number | null,
  action: string,
  target?: string,
  detail?: string,
): Promise<void> {
  await db.insert(auditLog).values({
    userId,
    action,
    target: target ?? null,
    detail: detail ?? null,
  });
}

export async function deleteAccount(userId: number): Promise<void> {
  // Anonimisasi email agar riwayat audit tetap bisa ditelusuri tanpa menyimpan identitas.
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await db
    .update(users)
    .set({
      email: `deleted-${userId}-${stamp}@invalid.local`,
      displayName: 'Akun dihapus',
      passwordHash: 'deleted',
      deletedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await logAudit(userId, 'account.delete');
}

export async function countUsers(): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(isNull(users.deletedAt));

  return rows[0]?.n ?? 0;
}
