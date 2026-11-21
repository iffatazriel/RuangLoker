import type { APIRoute } from 'astro';
import { storeFileReplacingKind } from '../../../../db/account';
import { getCv, getJobById } from '../../../../db/cv';
import { logAudit } from '../../../../lib/auth';
import { cvFileName } from '../../../../lib/cv-build';
import { renderCvPdf } from '../../../../lib/cv-pdf';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fcv', 302);

  const id = Number(params.id);
  const cv = Number.isInteger(id) && id > 0 ? await getCv(user.id, id) : null;
  if (!cv) return redirect('/cv?error=tidak-ada', 303);

  const job = await getJobById(cv.targetJobId);
  const role = job?.title || cv.sections.targetRole;
  const fileName = cvFileName(cv.sections.contact.fullName, role);

  const pdf = await renderCvPdf(cv.sections, fileName.replace(/\.pdf$/, ''));
  const stored = await storeFileReplacingKind(user.id, {
    kind: 'cv',
    originalName: fileName,
    mimeType: 'application/pdf',
    extension: 'pdf',
    data: pdf,
  });

  if (!stored.ok) return redirect(`/cv/${cv.id}?error=kuota`, 303);

  await logAudit(user.id, 'cv.pdf', String(cv.id), `${fileName} · ${pdf.length} bytes`);

  // Unduhan lewat endpoint brankas, jadi pemeriksaan pemilik berkas tetap satu pintu.
  return redirect(`/api/berkas/${stored.file.id}/unduh`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
