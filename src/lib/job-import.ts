import { MAX_LISTING_DAYS, type JobFormValues } from './job-form.ts';
import { FetchError, safeFetchPage } from './safe-fetch.ts';

// Membaca data terstruktur schema.org JobPosting (format yang dipakai Google for Jobs)
// dari satu halaman lowongan. Hasilnya hanya mengisi form; kurator tetap memeriksa.

type Node = Record<string, unknown>;
export type ImportedJob = {
  values: Partial<JobFormValues>;
  filled: (keyof JobFormValues)[];
  structured: boolean;
  notes: string[];
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export function htmlToText(html: string): string {
  const decoded = /&lt;\w/.test(html) ? decodeEntities(html) : html;
  return decodeEntities(
    decoded
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function listItems(html: string): string[] {
  const decoded = /&lt;\w/.test(html) ? decodeEntities(html) : html;
  return [...decoded.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => htmlToText(m[1])).filter((t) => t.length > 1);
}

const isType = (n: Node, t: string) => {
  const v = n['@type'];
  return v === t || (Array.isArray(v) && v.includes(t));
};

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RICH_PROPS = new Set(['description', 'qualifications', 'responsibilities', 'skills', 'experienceRequirements', 'educationRequirements']);

// Microdata (itemscope/itemprop), dipakai antara lain oleh Kalibrr dan SmartRecruiters.
export function findMicrodata(html: string): Node[] {
  const src = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  type Frame = { tag: string; start: number; scope?: Node; props?: string[]; content?: string };
  const stack: Frame[] = [];
  const roots: Node[] = [];
  const attr = (a: string, name: string) => a.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((x) => x !== undefined);
  const finish = (f: Frame, end: number) => {
    const raw = src.slice(f.start, end);
    if (f.props) {
      const parent = [...stack].reverse().find((s) => s.scope)?.scope;
      if (!parent) return f.scope && roots.push(f.scope);
      for (const p of f.props) {
        const value = f.scope ?? f.content ?? (RICH_PROPS.has(p) ? raw.trim() : htmlToText(raw));
        if (!(p in parent)) parent[p] = value;
      }
    } else if (f.scope) roots.push(f.scope);
  };
  for (const m of src.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)) {
    const [whole, closing, rawTag, attrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    const at = m.index!;
    if (closing) {
      const i = stack.map((f) => f.tag).lastIndexOf(tag);
      if (i < 0) continue;
      while (stack.length > i) {
        const f = stack.pop()!;
        if (f.scope || f.props) finish(f, at);
      }
      continue;
    }
    const hasScope = /\bitemscope\b/i.test(attrs);
    const itemprop = attr(attrs, 'itemprop');
    const type = attr(attrs, 'itemtype');
    const content = attr(attrs, 'content') ?? (/^(a|link)$/.test(tag) ? attr(attrs, 'href') : tag === 'time' ? attr(attrs, 'datetime') : undefined);
    const frame: Frame = {
      tag,
      start: at + whole.length,
      scope: hasScope ? { '@type': type ? type.trim().split(/[\/#]/).pop()! : 'Thing' } : undefined,
      props: itemprop ? itemprop.trim().split(/\s+/) : undefined,
      content: content !== undefined ? decodeEntities(content).trim() : undefined,
    };
    if (VOID_TAGS.has(tag) || selfClose) {
      if (frame.scope || frame.props) finish(frame, frame.start);
    } else stack.push(frame);
  }
  while (stack.length) {
    const f = stack.pop()!;
    if (f.scope || f.props) finish(f, src.length);
  }
  return roots;
}

export function findJobPostings(html: string): Node[] {
  const out: Node[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const n = v as Node;
    if (isType(n, 'JobPosting')) out.push(n);
    if (n['@graph']) walk(n['@graph']);
  };
  for (const m of html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      // JSON-LD rusak di halaman sumber; lewati blok ini.
    }
  }
  if (out.length === 0 && /itemtype=["']?https?:\/\/schema\.org\/JobPosting/i.test(html)) {
    const walkMicro = (n: Node) => {
      if (isType(n, 'JobPosting')) out.push(n);
      for (const v of Object.values(n)) if (v && typeof v === 'object' && !Array.isArray(v)) walkMicro(v as Node);
    };
    findMicrodata(html).forEach(walkMicro);
  }
  return out;
}

const str = (v: unknown): string => {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return str(v[0]);
  if (v && typeof v === 'object') return str((v as Node).name ?? (v as Node).description ?? '');
  return '';
};

const CITY_ALIASES: [RegExp, string][] = [
  [/tangerang selatan|tangsel|south tangerang|serpong|bintaro|pamulang|ciputat/, 'Tangerang Selatan'],
  [/jakarta selatan|south jakarta|jaksel/, 'Jakarta Selatan'],
  [/jakarta pusat|central jakarta|jakpus/, 'Jakarta Pusat'],
  [/jakarta timur|east jakarta|jaktim/, 'Jakarta Timur'],
  [/jakarta barat|west jakarta|jakbar/, 'Jakarta Barat'],
  [/jakarta utara|north jakarta|jakut/, 'Jakarta Utara'],
  [/bekasi|cikarang/, 'Bekasi'],
  [/depok/, 'Depok'],
  [/bogor|cibinong/, 'Bogor'],
  [/tangerang/, 'Tangerang'],
];

export function matchCity(...candidates: string[]): string | null {
  for (const c of candidates) {
    const s = c.toLowerCase();
    if (!s) continue;
    for (const [re, city] of CITY_ALIASES) if (re.test(s)) return city;
  }
  return null;
}

const EMPLOYMENT: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACTOR: 'Kontrak',
  TEMPORARY: 'Kontrak',
  INTERN: 'Magang',
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/gudang|warehouse|picker|packer|packing|inventory|logistik|logistic|checker/i, 'Gudang'],
  [/barista|cook|koki|kitchen|dapur|waiter|waitress|pelayan|f&b|restoran|crew outlet|bartender/i, 'F&B'],
  [/admin|administrasi|data entry|staff kantor|resepsionis|receptionist|sekretaris|customer service/i, 'Admin'],
  [/kasir|cashier|retail|toko|store|spg|spb|sales|pramuniaga|merchandiser/i, 'Retail'],
  [/driver|sopir|kurir|courier|operasional|operator|produksi|cleaning|security|satpam|teknisi/i, 'Operasional'],
];

export function guessCategory(title: string): string | null {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(title)) return cat;
  return null;
}

function salary(n: Node): { min?: number; max?: number } {
  const base = n.baseSalary as Node | undefined;
  if (!base || typeof base !== 'object') return {};
  const currency = str(base.currency).toUpperCase();
  if (currency && currency !== 'IDR') return {};
  const value = (typeof base.value === 'object' && base.value ? base.value : base) as Node;
  const unit = str(value.unitText ?? base.unitText).toUpperCase();
  const factor = !unit || unit === 'MONTH' ? 1 : unit === 'YEAR' ? 1 / 12 : 0;
  if (!factor) return {};
  const num = (v: unknown) => {
    const x = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''));
    return Number.isFinite(x) && x > 0 ? Math.round(x * factor) : undefined;
  };
  const single = num(value.value);
  return { min: num(value.minValue) ?? single, max: num(value.maxValue) ?? single };
}

const wibDate = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

const meta = (html: string, key: string) =>
  decodeEntities(
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`, 'i'))?.[1] ??
      '',
  ).trim();

export function extractJobFromHtml(html: string, pageUrl: string, now: Date): ImportedJob {
  const host = new URL(pageUrl).hostname.replace(/^www\./, '');
  const values: Partial<JobFormValues> = { sourceName: `Situs ${host}`, sourceUrl: pageUrl, verificationStatus: 'pending' };
  const notes: string[] = [];
  const job = findJobPostings(html)[0];

  if (!job) {
    const title = meta(html, 'og:title') || htmlToText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const desc = meta(html, 'og:description') || meta(html, 'description');
    if (title) values.title = title.slice(0, 120);
    if (desc) values.description = desc.slice(0, 2000);
    notes.push('Halaman ini tidak punya data lowongan terstruktur (JobPosting). Hanya judul dan deskripsi singkat yang diambil.');
    return { values, filled: filledKeys(values), structured: false, notes };
  }

  const title = htmlToText(str(job.title));
  if (title) values.title = title.slice(0, 120);
  const company = htmlToText(str(job.hiringOrganization));
  if (company) values.company = company.slice(0, 120);

  const descHtml = str(job.description) || str(job.responsibilities);
  if (descHtml) values.description = htmlToText(descHtml).slice(0, 3000);

  const reqSource = [job.qualifications, job.experienceRequirements, job.educationRequirements, job.skills]
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .map(str)
    .filter(Boolean);
  const requirements = (reqSource.length ? reqSource.flatMap((r) => (/<li/i.test(r) || /&lt;li/i.test(r) ? listItems(r) : htmlToText(r).split('\n'))) : listItems(descHtml))
    .map((r) => r.replace(/^[-•*\s]+/, '').trim())
    .filter((r) => r.length > 1)
    .slice(0, 15);
  if (requirements.length) values.requirements = requirements.join('\n');

  const locations = (Array.isArray(job.jobLocation) ? job.jobLocation : [job.jobLocation]).filter(Boolean) as Node[];
  const loc = locations[0];
  const address = (loc?.address ?? {}) as Node;
  const city = matchCity(str(address.addressLocality), str(address.addressRegion), str(address.streetAddress), str(loc?.name));
  if (city) values.city = city;
  else if (locations.length) notes.push('Kota tidak dikenali atau di luar Jabodetabek; pilih kota secara manual.');
  if (locations.length > 1) notes.push(`Lowongan ini punya ${locations.length} lokasi; yang diambil hanya yang pertama.`);
  const street = str(address.streetAddress);
  if (street && street.length <= 80) values.district = street;
  const geo = (loc?.geo ?? {}) as Node;
  if (geo.latitude && geo.longitude && city) {
    values.lat = String(geo.latitude);
    values.lng = String(geo.longitude);
  }

  const { min, max } = salary(job);
  if (min) values.salaryMin = String(min);
  if (max) values.salaryMax = String(max);

  const types = (Array.isArray(job.employmentType) ? job.employmentType : [job.employmentType]).map((t) => str(t).toUpperCase().replace(/[\s-]/g, '_'));
  const employment = types.map((t) => EMPLOYMENT[t]).find(Boolean);
  if (employment) values.employmentType = employment;

  const category = guessCategory(title) ?? guessCategory(`${str(job.occupationalCategory)} ${str(job.industry)}`);
  if (category) values.category = category;

  const validThrough = str(job.validThrough) ? new Date(str(job.validThrough)) : null;
  if (validThrough && !Number.isNaN(validThrough.getTime())) {
    const cap = now.getTime() + MAX_LISTING_DAYS * 86_400_000;
    if (validThrough.getTime() > cap) {
      values.expiresAt = wibDate(new Date(cap));
      notes.push(`Sumber menulis batas ${wibDate(validThrough)}; batas tayang di RuangLoker dibatasi ${MAX_LISTING_DAYS} hari.`);
    } else if (validThrough.getTime() > now.getTime()) values.expiresAt = wibDate(validThrough);
    else notes.push(`Menurut halaman sumber, lowongan ini sudah berakhir pada ${wibDate(validThrough)}.`);
  }

  const contact = (job.applicationContact ?? {}) as Node;
  const email = str(contact.email).replace(/^mailto:/i, '');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    values.applyChannel = 'Email';
    values.applyTarget = email;
  } else {
    values.applyChannel = 'Portal Eksternal';
    values.applyTarget = str(job.url) && /^https?:\/\//.test(str(job.url)) ? str(job.url) : pageUrl;
  }

  return { values, filled: filledKeys(values), structured: true, notes };
}

function filledKeys(values: Partial<JobFormValues>): (keyof JobFormValues)[] {
  const skip = new Set(['sourceName', 'sourceUrl', 'verificationStatus']);
  return (Object.keys(values) as (keyof JobFormValues)[]).filter((k) => !skip.has(k) && values[k]);
}

export async function importJobFromUrl(url: string, now: Date): Promise<{ ok: true; job: ImportedJob } | { ok: false; error: string }> {
  try {
    const page = await safeFetchPage(url);
    if (page.status >= 400) return { ok: false, error: `Halaman sumber membalas ${page.status}. Cek tautannya atau isi manual.` };
    return { ok: true, job: extractJobFromHtml(page.html, page.url, now) };
  } catch (err) {
    if (err instanceof FetchError) return { ok: false, error: err.message };
    throw err;
  }
}
