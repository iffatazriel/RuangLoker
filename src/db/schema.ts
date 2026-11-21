import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { CvScoreCategory, CvSections } from '../lib/cv-score';

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
    sourceStatus: text('source_status'),
    sourceCheckedAt: integer('source_checked_at', { mode: 'timestamp' }),
    sourceFailCount: integer('source_fail_count').notNull().default(0),

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
    passwordChangedAt: integer('password_changed_at', { mode: 'timestamp' }),
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

export const cvs = sqliteTable(
  'cvs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'ats' | 'creative' — creative belum dibangun.
    kind: text('kind').notNull().default('ats'),
    sourceProfileUpdatedAt: integer('source_profile_updated_at', { mode: 'timestamp' }),
    sections: text('sections', { mode: 'json' }).$type<CvSections>().notNull(),
    targetJobId: integer('target_job_id').references(() => jobs.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (t) => [index('cvs_user_idx').on(t.userId)],
);

export const cvScores = sqliteTable(
  'cv_scores',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cvId: integer('cv_id')
      .notNull()
      .references(() => cvs.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    breakdown: text('breakdown', { mode: 'json' }).$type<CvScoreCategory[]>().notNull(),
    rulesVersion: text('rules_version').notNull(),
    computedAt: integer('computed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('cv_scores_cv_idx').on(t.cvId)],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type CurationEntry = typeof curationLog.$inferSelect;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type VaultFile = typeof files.$inferSelect;
export type Consent = typeof consents.$inferSelect;
export type Cv = typeof cvs.$inferSelect;
export type CvScore = typeof cvScores.$inferSelect;

export const applications = sqliteTable(
  'applications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    cvId: integer('cv_id').references(() => cvs.id, { onDelete: 'set null' }),
    // Salinan data lowongan saat lamaran disiapkan, supaya riwayat tetap utuh walau lowongan berubah.
    jobTitle: text('job_title').notNull(),
    company: text('company').notNull(),
    channel: text('channel').notNull(),
    target: text('target').notNull(),
    // 'formal' | 'fresh' | 'retail'
    template: text('template').notNull(),
    // 'formal' | 'semi'
    tone: text('tone').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    // 'draf' | 'terkirim' | 'batal'
    status: text('status').notNull().default('draf'),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('applications_user_idx').on(t.userId, t.createdAt)],
);

export const cvLinks = sqliteTable(
  'cv_links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Token = HMAC(kunci brankas, nonce). Database hanya menyimpan nonce dan hash token,
    // jadi kebocoran database saja tidak cukup untuk membuka CV.
    nonce: text('nonce').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    accessCount: integer('access_count').notNull().default(0),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('cv_links_token_unique').on(t.tokenHash), index('cv_links_user_idx').on(t.userId)],
);

export type Application = typeof applications.$inferSelect;
export type CvLink = typeof cvLinks.$inferSelect;

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Kode untuk berita transfer, mis. RL-7K2Q9.
    code: text('code').notNull(),
    product: text('product').notNull(),
    amountRp: integer('amount_rp').notNull(),
    credits: integer('credits').notNull().default(0),
    // 'menunggu' | 'dibayar' | 'selesai' | 'ditolak' | 'batal'
    status: text('status').notNull().default('menunggu'),
    payerNote: text('payer_note'),
    claimedAt: integer('claimed_at', { mode: 'timestamp' }),
    adminNote: text('admin_note'),
    confirmedBy: text('confirmed_by'),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('orders_code_unique').on(t.code), index('orders_user_idx').on(t.userId), index('orders_status_idx').on(t.status)],
);

export const creditLedger = sqliteTable(
  'credit_ledger',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    // 'pembelian' | 'lamaran'
    reason: text('reason').notNull(),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
    applicationId: integer('application_id').references(() => applications.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('credit_ledger_user_idx').on(t.userId), uniqueIndex('credit_ledger_order_unique').on(t.orderId)],
);

export type Order = typeof orders.$inferSelect;

export const passwordResets = sqliteTable(
  'password_resets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('password_resets_token_unique').on(t.tokenHash), index('password_resets_user_idx').on(t.userId)],
);

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: integer('reset_at').notNull(),
});

export const jobReports = sqliteTable(
  'job_reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    target: text('target').notNull(),
    reason: text('reason').notNull(),
    contact: text('contact'),
    // 'baru' | 'ditindak' | 'diabaikan'
    status: text('status').notNull().default('baru'),
    resolvedBy: text('resolved_by'),
    resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index('job_reports_status_idx').on(t.status, t.createdAt)],
);

export type JobReport = typeof jobReports.$inferSelect;
