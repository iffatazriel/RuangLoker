// Peringatan lowongan ganda: tautan sumber sama, atau perusahaan sama dengan posisi yang mirip.

export type DedupeCandidate = { title: string; company: string; sourceUrl?: string | null };
export type DedupeExisting = DedupeCandidate & { id: number };
export type DuplicateMatch<T> = { job: T; reason: 'tautan' | 'mirip' };

const plain = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const normalizeCompany = (s: string) =>
  plain(s)
    .replace(/\b(pt|cv|ud|tbk|persero|indonesia)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|source$)/i.test(k)) u.searchParams.delete(k);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}${u.search}`.toLowerCase();
  } catch {
    return null;
  }
}

const tokens = (s: string) => new Set(plain(s).split(' ').filter((t) => t.length > 1));

export function titleSimilarity(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  return common / (A.size + B.size - common);
}

export function findDuplicates<T extends DedupeExisting>(c: DedupeCandidate, existing: T[], excludeId?: number): DuplicateMatch<T>[] {
  const url = normalizeUrl(c.sourceUrl);
  const company = normalizeCompany(c.company);
  const out: DuplicateMatch<T>[] = [];
  for (const job of existing) {
    if (job.id === excludeId) continue;
    if (url && normalizeUrl(job.sourceUrl) === url) out.push({ job, reason: 'tautan' });
    else if (company && normalizeCompany(job.company) === company && titleSimilarity(c.title, job.title) >= 0.5)
      out.push({ job, reason: 'mirip' });
  }
  return out;
}
