import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './index';
import { jobReports, jobs, type JobReport } from './schema';

export async function createReport(input: {
  jobId: number | null;
  userId: number | null;
  target: string;
  reason: string;
  contact: string | null;
}): Promise<JobReport> {
  const [row] = await db.insert(jobReports).values(input).returning();
  return row;
}

export async function openReports() {
  return db
    .select({ report: jobReports, jobTitle: jobs.title, jobSlug: jobs.slug, jobId: jobs.id })
    .from(jobReports)
    .leftJoin(jobs, eq(jobs.id, jobReports.jobId))
    .where(eq(jobReports.status, 'baru'))
    .orderBy(desc(jobReports.createdAt));
}

export async function resolveReport(id: number, status: 'ditindak' | 'diabaikan', admin: string): Promise<boolean> {
  const rows = await db
    .update(jobReports)
    .set({ status, resolvedBy: admin, resolvedAt: new Date() })
    .where(and(eq(jobReports.id, id), inArray(jobReports.status, ['baru'])))
    .returning({ id: jobReports.id });
  return rows.length > 0;
}
