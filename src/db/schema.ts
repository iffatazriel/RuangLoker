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

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const consents = sqliteTable(
  'consents',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'akun' | 'data_sensitif' | 'pemasaran'
    type: text('type').notNull(),
    version: text('version').notNull(),
    evidence: text('evidence'),
    grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  },
  (t) => [index('consents_user_type_idx').on(t.userId, t.type)],
);

export const profiles = sqliteTable('profiles', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  fullName: text('full_name'),
  phone: text('phone'),
  emailForApplication: text('email_for_application'),

  city: text('city'),
  maxRadiusKm: integer('max_radius_km'),

  lastEducation: text('last_education'),
  lastExperience: text('last_experience'),
  skills: text('skills', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),

  desiredRoles: text('desired_roles'),
  expectedSalary: text('expected_salary'),
  availability: text('availability'),

  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const files = sqliteTable(
  'files',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 'cv' | 'ijazah' | 'transkrip' | 'ktp' | 'sertifikat' | 'foto'
    kind: text('kind').notNull(),
    label: text('label').notNull(),

    originalName: text('original_name').notNull(),
    storedName: text('stored_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),

    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    sha256: text('sha256').notNull(),

    isSensitive: integer('is_sensitive', { mode: 'boolean' }).notNull().default(false),
    isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (t) => [
    index('files_user_idx').on(t.userId),
    index('files_kind_idx').on(t.userId, t.kind),
    uniqueIndex('files_stored_name_unique').on(t.storedName),
  ],
);

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    target: text('target'),
    detail: text('detail'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('audit_user_idx').on(t.userId)],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type CurationEntry = typeof curationLog.$inferSelect;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type VaultFile = typeof files.$inferSelect;
export type Consent = typeof consents.$inferSelect;
