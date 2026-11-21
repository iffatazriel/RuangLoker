import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './index';
import { passwordResets, users, type User } from './schema';

export const RESET_TTL_MINUTES = 60;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createResetToken(userId: number): Promise<string> {
  const now = new Date();
  await db
    .update(passwordResets)
    .set({ usedAt: now })
    .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt)));

  const token = randomBytes(32).toString('base64url');
  await db.insert(passwordResets).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + RESET_TTL_MINUTES * 60_000),
  });
  return token;
}

export async function findResetUser(token: string): Promise<{ resetId: number; user: User } | null> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const [row] = await db
    .select({ resetId: passwordResets.id, user: users })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function applyNewPassword(resetId: number, userId: number, passwordHash: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const used = await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.id, resetId), isNull(passwordResets.usedAt)))
      .returning({ id: passwordResets.id });
    if (used.length === 0) return false;
    await tx.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, userId));
    await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt)));
    return true;
  });
}
