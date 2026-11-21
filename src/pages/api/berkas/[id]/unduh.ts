import type { APIRoute } from 'astro';
import { getFile } from '../../../../db/account';
import { logAudit } from '../../../../lib/auth';
import { openFile } from '../../../../lib/vault';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response('Tidak diizinkan', { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('Berkas tidak valid', { status: 400 });
  }

  const file = await getFile(user.id, id);
  if (!file) return new Response('Berkas tidak ditemukan', { status: 404 });

  let data: Buffer;
  try {
    data = await openFile(user.id, file.storedName, file.iv, file.authTag);
  } catch {
    return new Response('Berkas rusak atau kunci tidak cocok', { status: 500 });
  }

  if (file.isSensitive) {
    await logAudit(user.id, 'file.download', file.kind);
  }

  const safeName = file.originalName.replace(/["\\\r\n]/g, '_');

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(data.length),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
