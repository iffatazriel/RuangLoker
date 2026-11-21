import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobs = sqliteTable(
  'jobs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),

    title: text('title').notNull(),
    company: text('company').notNull(),
    companyInitials: text('company_initials').notNull(),

    category: text('category').notNull(),
    employmentType: text('employment_type').notNull(),

    city: text('city').notNull(),
    province: text('province').notNull(),
    district: text('district'),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),

    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),

    description: text('description').notNull(),
    requirements: text('requirements', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),

    applyChannel: text('apply_channel').notNull(),
    applyTarget: text('apply_target').notNull(),

    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url'),

    verificationStatus: text('verification_status').notNull().default('pending'),
    verifiedAt: integer('verified_at', { mode: 'timestamp' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),

    isDirectEmployer: integer('is_direct_employer', { mode: 'boolean' }).notNull().default(false),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('jobs_slug_unique').on(t.slug),
    index('jobs_city_idx').on(t.city),
    index('jobs_status_idx').on(t.verificationStatus),
    index('jobs_category_idx').on(t.category),
    index('jobs_geo_idx').on(t.lat, t.lng),
  ],
);

export const curationLog = sqliteTable(
  'curation_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    note: text('note'),
    curator: text('curator').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('curation_job_idx').on(t.jobId)],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type CurationEntry = typeof curationLog.$inferSelect;
