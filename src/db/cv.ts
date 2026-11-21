import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from './index';
import { cvScores, cvs, jobs } from './schema';
import type { Cv, CvScore, Job } from './schema';
import { RULES_VERSION, scoreCv, type CvKind, type CvSections, type CvTargetJob } from '../lib/cv-score';

export type CvWithScore = Cv & { latestScore: CvScore | null };

export function toTargetJob(job: Job | null): CvTargetJob | null {
  if (!job) return null;
  return { title: job.title, requirements: job.requirements, description: job.description };
}

export async function getJobById(jobId: number | null): Promise<Job | null> {
  if (!jobId) return null;
  const rows = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows[0] ?? null;
}

export async function listCvs(userId: number): Promise<CvWithScore[]> {
  const rows = await db
    .select()
    .from(cvs)
    .where(and(eq(cvs.userId, userId), isNull(cvs.deletedAt)))
    .orderBy(desc(cvs.updatedAt));

  if (rows.length === 0) return [];

  const scores = await db
    .select()
    .from(cvScores)
    .where(inArray(cvScores.cvId, rows.map((r) => r.id)))
    .orderBy(desc(cvScores.id));

  return rows.map((cv) => ({ ...cv, latestScore: scores.find((s) => s.cvId === cv.id) ?? null }));
}

export async function getCv(userId: number, cvId: number): Promise<Cv | null> {
  const rows = await db
    .select()
    .from(cvs)
    .where(and(eq(cvs.id, cvId), eq(cvs.userId, userId), isNull(cvs.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCv(
  userId: number,
  input: { kind: CvKind; sections: CvSections; sourceProfileUpdatedAt: Date | null; targetJobId?: number | null },
): Promise<Cv> {
  const [row] = await db
    .insert(cvs)
    .values({
      userId,
      kind: input.kind,
      sections: input.sections,
      sourceProfileUpdatedAt: input.sourceProfileUpdatedAt,
      targetJobId: input.targetJobId ?? null,
    })
    .returning();
  return row;
}

export async function updateCv(
  userId: number,
  cvId: number,
  patch: { sections?: CvSections; targetJobId?: number | null; sourceProfileUpdatedAt?: Date | null },
): Promise<Cv | null> {
  const [row] = await db
    .update(cvs)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(cvs.id, cvId), eq(cvs.userId, userId), isNull(cvs.deletedAt)))
    .returning();
  return row ?? null;
}

export async function softDeleteCv(userId: number, cvId: number): Promise<void> {
  await db
    .update(cvs)
    .set({ deletedAt: new Date() })
    .where(and(eq(cvs.id, cvId), eq(cvs.userId, userId)));
}

// Dipakai saat hapus akun: isi CV adalah data pribadi, jadi dihapus fisik, bukan ditandai.
export async function purgeUserCvs(userId: number): Promise<void> {
  const ids = (await db.select({ id: cvs.id }).from(cvs).where(eq(cvs.userId, userId))).map((r) => r.id);
  if (ids.length === 0) return;
  await db.delete(cvScores).where(inArray(cvScores.cvId, ids));
  await db.delete(cvs).where(eq(cvs.userId, userId));
}

export async function recordScore(cv: Cv): Promise<CvScore> {
  const targetJob = toTargetJob(await getJobById(cv.targetJobId));
  const result = scoreCv({ kind: cv.kind as CvKind, sections: cv.sections, targetJob });

  const [row] = await db
    .insert(cvScores)
    .values({ cvId: cv.id, score: result.score, breakdown: result.categories, rulesVersion: result.rulesVersion })
    .returning();
  return row;
}

export async function scoreHistory(cvId: number, limit = 6): Promise<CvScore[]> {
  return db.select().from(cvScores).where(eq(cvScores.cvId, cvId)).orderBy(desc(cvScores.id)).limit(limit);
}

// Skor dari versi aturan lama tidak dipakai ulang; hitung ulang agar penjelasannya sesuai aturan sekarang.
export async function currentScore(cv: Cv): Promise<CvScore> {
  const [latest] = await scoreHistory(cv.id, 1);
  if (latest && latest.rulesVersion === RULES_VERSION) return latest;
  return recordScore(cv);
}
