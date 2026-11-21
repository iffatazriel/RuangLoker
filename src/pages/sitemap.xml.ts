import type { APIRoute } from 'astro';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { db } from '../db';
import { jobs } from '../db/schema';

const STATIC_PATHS = ['/', '/lowongan', '/paket', '/perusahaan', '/privasi', '/syarat', '/laporkan'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://ruangloker.id')).origin;
  const rows = await db
    .select({ slug: jobs.slug, updatedAt: jobs.updatedAt })
    .from(jobs)
    .where(
      and(
        eq(jobs.isActive, true),
        inArray(jobs.verificationStatus, ['verified', 'manual_checked']),
        gte(jobs.expiresAt, new Date()),
      ),
    );
  const urls = [
    ...STATIC_PATHS.map((p) => `<url><loc>${base}${p}</loc></url>`),
    ...rows.map(
      (r) =>
        `<url><loc>${esc(`${base}/lowongan/${r.slug}`)}</loc><lastmod>${r.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`,
    ),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  );
};
