import type { APIRoute } from 'astro';
import { getApplication } from '../../../../db/applications';
import { letterFileName } from '../../../../lib/letter';
import { renderLetterPdf } from '../../../../lib/letter-pdf';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response('Tidak diizinkan', { status: 401 });

  const id = Number(params.id);
  const app = Number.isInteger(id) && id > 0 ? await getApplication(user.id, id) : null;
  if (!app) return new Response('Lamaran tidak ditemukan', { status: 404 });

  const name = app.subject.split('—')[1]?.trim() ?? '';
  const fileName = letterFileName(name, app.jobTitle);
  const pdf = await renderLetterPdf(app.body, fileName.replace(/\.pdf$/, ''));

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store, private',
    },
  });
};
