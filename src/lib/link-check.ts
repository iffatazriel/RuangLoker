import { and, eq, gte, isNotNull } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { jobs } from '../db/schema.ts';
import { findJobPostings } from './job-import.ts';
import { FetchError, safeFetchPage } from './safe-fetch.ts';

// Cek harian tautan sumber lowongan aktif. Hasilnya hanya menandai; kurator yang menurunkan.

export type LinkStatus = 'ok' | 'mati' | 'ditutup' | 'gagal';
export const FAIL_THRESHOLD = 3;

const CLOSED_PATTERNS = [
  /lowongan (ini )?(sudah|telah) (ditutup|berakhir|tidak tersedia|tidak aktif)/i,
  /(pendaftaran|rekrutmen|penerimaan) (sudah|telah) ditutup/i,
  /no longer (accepting applications|available|open)/i,
  /(job|position|vacancy) (has been|is) (closed|filled|expired)/i,
  /this job (posting )?(has )?expired/i,
];

export function classifyLinkResponse(r: { status: number; html: string } | null, now: Date): LinkStatus {
  if (!r) return 'gagal';
  if (r.status === 404 || r.status === 410) return 'mati';
  if (r.status >= 400) return 'gagal';
  for (const job of findJobPostings(r.html)) {
    const until = typeof job.validThrough === 'string' ? new Date(job.validThrough) : null;
    if (until && !Number.isNaN(until.getTime()) && until.getTime() < now.getTime()) return 'ditutup';
  }
  const text = r.html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return CLOSED_PATTERNS.some((re) => re.test(text)) ? 'ditutup' : 'ok';
}

export function isLinkFlagged(job: { sourceStatus: string | null; sourceFailCount: number }): boolean {
  return job.sourceStatus === 'mati' || job.sourceStatus === 'ditutup' || (job.sourceStatus === 'gagal' && job.sourceFailCount >= FAIL_THRESHOLD);
}

export type LinkCheckSummary = { checked: number; flagged: { id: number; title: string; status: LinkStatus }[]; newlyFlagged: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkJobLinks(db: LibSQLDatabase<any>, { concurrency = 4, now = new Date() } = {}): Promise<LinkCheckSummary> {
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.isActive, true), isNotNull(jobs.sourceUrl), gte(jobs.expiresAt, now)));
  const summary: LinkCheckSummary = { checked: 0, flagged: [], newlyFlagged: 0 };
  const queue = [...rows];

  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      let page: { status: number; html: string } | null = null;
      try {
        page = await safeFetchPage(job.sourceUrl!, { timeoutMs: 15_000 });
      } catch (err) {
        if (!(err instanceof FetchError)) throw err;
      }
      const status = classifyLinkResponse(page, now);
      const failCount = status === 'gagal' ? job.sourceFailCount + 1 : 0;
      await db
        .update(jobs)
        .set({ sourceStatus: status, sourceCheckedAt: now, sourceFailCount: failCount, ...(status === 'ok' ? { lastSeenAt: now } : {}) })
        .where(eq(jobs.id, job.id));
      summary.checked++;
      const flaggedNow = isLinkFlagged({ sourceStatus: status, sourceFailCount: failCount });
      if (flaggedNow) {
        summary.flagged.push({ id: job.id, title: `${job.title} — ${job.company}`, status });
        if (!isLinkFlagged(job)) summary.newlyFlagged++;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));
  return summary;
}
