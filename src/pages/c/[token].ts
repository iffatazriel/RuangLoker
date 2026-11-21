import type { APIRoute } from 'astro';
import { activeCvFile, findCvLinkByToken, touchCvLink } from '../../db/applications';
import { openFile } from '../../lib/vault';

const notFound = () =>
  new Response('Tautan CV tidak ditemukan, sudah dicabut, atau kedaluwarsa. Minta tautan baru ke pelamar.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
  });

// Tautan publik untuk HRD: hanya CV aktif, tidak pernah berkas lain di brankas.
export const GET: APIRoute = async ({ params }) => {
  const link = await findCvLinkByToken(params.token ?? '');
  if (!link) return notFound();

  const file = await activeCvFile(link.userId);
  if (!file) return notFound();

  let data: Buffer;
  try {
    data = await openFile(link.userId, file.storedName, file.iv, file.authTag);
  } catch {
    return notFound();
  }
  await touchCvLink(link);

  const safeName = file.originalName.replace(/["\\\r\n]/g, '_');
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(data.length),
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  });
};
