import { and, desc, eq, gte, inArray, like, or, sql } from 'drizzle-orm';
import { db } from './index';
import { jobs, type Job } from './schema';

export type JobWithDistance = Job & { distanceKm: number | null };

const PUBLIC_STATUSES = ['verified', 'manual_checked'] as const;

const haversine = (lat: number, lng: number) => sql<number>`
  6371 * 2 * asin(sqrt(
    power(sin(radians(${lat} - ${jobs.lat}) / 2), 2) +
    cos(radians(${lat})) * cos(radians(${jobs.lat})) *
    power(sin(radians(${lng} - ${jobs.lng}) / 2), 2)
  ))
`;

export type JobQuery = {
  q?: string;
  city?: string;
  category?: string;
  employmentType?: string;
  channel?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
};

export async function findJobs(query: JobQuery = {}): Promise<JobWithDistance[]> {
  const now = new Date();
  const hasGeo = typeof query.lat === 'number' && typeof query.lng === 'number';

  const conditions = [
    eq(jobs.isActive, true),
    inArray(jobs.verificationStatus, [...PUBLIC_STATUSES]),
    gte(jobs.expiresAt, now),
  ];

  if (query.q) {
    const term = `%${query.q}%`;
    conditions.push(
      or(like(jobs.title, term), like(jobs.company, term), like(jobs.description, term))!,
    );
  }
  if (query.city) conditions.push(eq(jobs.city, query.city));
  if (query.category) conditions.push(eq(jobs.category, query.category));
  if (query.employmentType) conditions.push(eq(jobs.employmentType, query.employmentType));
  if (query.channel) conditions.push(eq(jobs.applyChannel, query.channel));

  const distance = hasGeo ? haversine(query.lat!, query.lng!) : sql<number>`NULL`;

  if (hasGeo && query.radiusKm) {
    conditions.push(sql`${distance} <= ${query.radiusKm}`);
  }

  const rows = await db
    .select({
      job: jobs,
      distanceKm: distance,
    })
    .from(jobs)
    .where(and(...conditions))
    .orderBy(hasGeo ? sql`${distance} ASC` : desc(jobs.lastSeenAt))
    .limit(query.limit ?? 60);

  return rows.map((r) => ({ ...r.job, distanceKm: r.distanceKm ?? null }));
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const rows = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getFacets() {
  const rows = await db
    .select({
      city: jobs.city,
      category: jobs.category,
      employmentType: jobs.employmentType,
      channel: jobs.applyChannel,
    })
    .from(jobs)
    .where(and(eq(jobs.isActive, true), inArray(jobs.verificationStatus, [...PUBLIC_STATUSES])));

  const uniq = (values: string[]) => [...new Set(values)].sort();
  return {
    cities: uniq(rows.map((r) => r.city)),
    categories: uniq(rows.map((r) => r.category)),
    employmentTypes: uniq(rows.map((r) => r.employmentType)),
    channels: uniq(rows.map((r) => r.channel)),
  };
}

export type CurationQueue = {
  needingReview: Job[];
  expiringSoon: Job[];
  expired: Job[];
};

export async function getCurationQueue(): Promise<CurationQueue> {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86_400_000);

  const all = await db.select().from(jobs).orderBy(desc(jobs.lastSeenAt));

  return {
    needingReview: all.filter((j) => j.verificationStatus === 'pending'),
    expiringSoon: all.filter(
      (j) =>
        j.isActive &&
        j.verificationStatus !== 'pending' &&
        j.expiresAt !== null &&
        new Date(j.expiresAt) > now &&
        new Date(j.expiresAt) <= inSevenDays,
    ),
    expired: all.filter((j) => j.expiresAt !== null && new Date(j.expiresAt) <= now),
  };
}

export async function getAllJobsForCuration(): Promise<Job[]> {
  return db.select().from(jobs).orderBy(desc(jobs.updatedAt));
}

export async function countActiveJobs(): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.isActive, true),
        inArray(jobs.verificationStatus, [...PUBLIC_STATUSES]),
        gte(jobs.expiresAt, new Date()),
      ),
    );
  return rows[0]?.n ?? 0;
}
