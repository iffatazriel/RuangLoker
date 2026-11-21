import { and, count, desc, eq, gte, isNull, ne } from 'drizzle-orm';
import { db } from './index';
import { applications, cvLinks, files, type Application, type CvLink, type Job, type Profile } from './schema';
import { listCvs } from './cv';
import { getProfile } from './account';
import { logAudit } from '../lib/auth';
import { creditBalance, creditsSpentSince, spendCredit } from './orders';
import { buildApplication, type LetterApplicant, type LetterTemplate, type LetterTone } from '../lib/letter';
import { hashToken, linkToken, newLinkNonce } from '../lib/vault';

export const FREE_MONTHLY_APPLICATIONS = 3;
export const CV_LINK_DAYS = 30;

// Awal bulan berjalan menurut WIB (UTC+7).
export function monthStartWib(now = new Date()): Date {
  const wib = new Date(now.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - 7 * 3600_000);
}

export async function quotaState(userId: number) {
  const since = monthStartWib();
  const [row] = await db
    .select({ n: count() })
    .from(applications)
    .where(and(eq(applications.userId, userId), gte(applications.createdAt, since), ne(applications.status, 'batal')));
  const [paid, credits] = await Promise.all([creditsSpentSince(userId, since), creditBalance(userId)]);
  const used = Math.max(0, (row?.n ?? 0) - paid);
  const remaining = Math.max(0, FREE_MONTHLY_APPLICATIONS - used);
  return { used, limit: FREE_MONTHLY_APPLICATIONS, remaining, credits, canPrepare: remaining > 0 || credits > 0 };
}

export async function listApplications(userId: number): Promise<Application[]> {
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt), desc(applications.id));
}

export async function getApplication(userId: number, id: number): Promise<Application | null> {
  const rows = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findOpenApplication(userId: number, jobId: number): Promise<Application | null> {
  const rows = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId), ne(applications.status, 'batal')))
    .orderBy(desc(applications.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function applicantFor(userId: number, profile: Profile | null, accountEmail: string) {
  const cv = (await listCvs(userId))[0] ?? null;
  const s = cv?.sections;
  const exp = s?.experience.find((e) => e.role.trim() || e.company.trim());
  const edu = s?.education.find((e) => e.institution.trim());
  const applicant: LetterApplicant = {
    fullName: s?.contact.fullName || profile?.fullName || '',
    email: profile?.emailForApplication || s?.contact.email || accountEmail,
    phone: s?.contact.phone || profile?.phone || '',
    city: s?.contact.city || profile?.city || '',
    education: edu ? [edu.major, edu.institution].filter((v) => v.trim()).join(' di ') : profile?.lastEducation ?? '',
    experience: exp ? [exp.role, exp.company].filter((v) => v.trim()).join(' di ') : profile?.lastExperience ?? '',
    skills: s?.skills ?? profile?.skills ?? [],
  };
  return { applicant, cvId: cv?.id ?? null };
}

export function composeFor(job: Pick<Job, 'title' | 'company' | 'city' | 'applyChannel' | 'requirements'>, applicant: LetterApplicant, template: LetterTemplate, tone: LetterTone) {
  return buildApplication({
    applicant,
    job: { title: job.title, company: job.company, city: job.city, channel: job.applyChannel, requirements: job.requirements },
    template,
    tone,
    date: new Date(),
  });
}

export async function createApplication(values: typeof applications.$inferInsert): Promise<Application> {
  const [row] = await db.insert(applications).values(values).returning();
  return row;
}

export async function updateApplication(userId: number, id: number, patch: Partial<typeof applications.$inferInsert>): Promise<void> {
  await db
    .update(applications)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function activeCvFile(userId: number) {
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.userId, userId), eq(files.kind, 'cv'), isNull(files.deletedAt)))
    .orderBy(desc(files.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function activeCvLink(userId: number): Promise<(CvLink & { token: string }) | null> {
  const rows = await db
    .select()
    .from(cvLinks)
    .where(and(eq(cvLinks.userId, userId), isNull(cvLinks.revokedAt), gte(cvLinks.expiresAt, new Date())))
    .orderBy(desc(cvLinks.id))
    .limit(1);
  const link = rows[0];
  return link ? { ...link, token: linkToken(link.nonce) } : null;
}

export async function createCvLink(userId: number): Promise<CvLink & { token: string }> {
  await revokeCvLinks(userId);
  const nonce = newLinkNonce();
  const token = linkToken(nonce);
  const [row] = await db
    .insert(cvLinks)
    .values({ userId, nonce, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + CV_LINK_DAYS * 86400_000) })
    .returning();
  return { ...row, token };
}

export async function ensureCvLink(userId: number) {
  return (await activeCvLink(userId)) ?? createCvLink(userId);
}

export async function revokeCvLinks(userId: number): Promise<void> {
  await db
    .update(cvLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(cvLinks.userId, userId), isNull(cvLinks.revokedAt)));
}

export async function findCvLinkByToken(token: string): Promise<CvLink | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const rows = await db.select().from(cvLinks).where(eq(cvLinks.tokenHash, hashToken(token))).limit(1);
  const link = rows[0];
  if (!link || link.revokedAt || link.expiresAt.getTime() < Date.now()) return null;
  return link;
}

export async function touchCvLink(link: CvLink): Promise<void> {
  await db
    .update(cvLinks)
    .set({ accessCount: link.accessCount + 1, lastAccessedAt: new Date() })
    .where(eq(cvLinks.id, link.id));
}

export const SUPPORTED_CHANNELS = new Set(['Email', 'WhatsApp', 'Google Form']);
export const MAX_QUEUE = 5;

export function isPreparable(job: Job): boolean {
  return (
    job.isActive &&
    ['verified', 'manual_checked'].includes(job.verificationStatus) &&
    !(job.expiresAt && job.expiresAt.getTime() < Date.now()) &&
    SUPPORTED_CHANNELS.has(job.applyChannel)
  );
}

// Pakai lamaran terbuka untuk lowongan yang sama, atau buat baru kalau kuota masih ada.
export async function prepareApplication(
  user: { id: number; email: string },
  job: Job,
): Promise<{ app: Application; created: boolean } | { error: 'kuota' }> {
  const open = await findOpenApplication(user.id, job.id);
  if (open) return { app: open, created: false };
  const quota = await quotaState(user.id);
  if (!quota.canPrepare) return { error: 'kuota' };

  const { applicant, cvId } = await applicantFor(user.id, await getProfile(user.id), user.email);
  const template: LetterTemplate = job.category === 'Admin' ? (applicant.experience ? 'formal' : 'fresh') : 'retail';
  const { subject, body } = composeFor(job, applicant, template, 'formal');
  const app = await createApplication({
    userId: user.id,
    jobId: job.id,
    cvId,
    jobTitle: job.title,
    company: job.company,
    channel: job.applyChannel,
    target: job.applyTarget,
    template,
    tone: 'formal',
    subject,
    body,
  });
  if (quota.remaining <= 0) await spendCredit(user.id, app.id);
  await logAudit(user.id, 'lamaran.siapkan', String(app.id), `${job.title} · ${job.company}${quota.remaining <= 0 ? ' · kredit' : ''}`);
  return { app, created: true };
}

export function parseQueue(raw: string | null): number[] {
  const ids = (raw ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, MAX_QUEUE);
}
