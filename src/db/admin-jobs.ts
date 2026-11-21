import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { curationLog, jobs, type Job } from './schema';
import { jobSlug, type JobRecord } from '../lib/job-form';

const verifiedFields = (status: string, now: Date, prev?: Job) =>
  status === 'verified' || status === 'manual_checked'
    ? { verifiedAt: prev?.verificationStatus === status ? prev.verifiedAt : now, isActive: true }
    : status === 'rejected'
      ? { isActive: false }
      : {};

export async function createJob(record: JobRecord, curator: string): Promise<Job> {
  const now = new Date();
  const [job] = await db
    .insert(jobs)
    .values({
      ...record,
      slug: jobSlug(record.title, record.company, randomBytes(3).toString('hex')),
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
      ...verifiedFields(record.verificationStatus, now),
    })
    .returning();
  await db.insert(curationLog).values({ jobId: job.id, action: 'create', curator, createdAt: now });
  return job;
}

export async function getJobById(id: number): Promise<Job | null> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return job ?? null;
}

export async function updateJob(prev: Job, record: JobRecord, curator: string): Promise<void> {
  const now = new Date();
  await db
    .update(jobs)
    .set({ ...record, updatedAt: now, lastSeenAt: now, ...verifiedFields(record.verificationStatus, now, prev) })
    .where(eq(jobs.id, prev.id));
  await db.insert(curationLog).values({ jobId: prev.id, action: 'edit', curator, createdAt: now });
}
