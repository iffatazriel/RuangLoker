import type { APIRoute } from 'astro';
import { getCv, softDeleteCv } from '../../../../db/cv';
import { logAudit } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fcv', 302);

  const id = Number(params.id);
  const cv = Number.isInteger(id) && id > 0 ? await getCv(user.id, id) : null;
  if (!cv) return redirect('/cv?error=tidak-ada', 303);

  await softDeleteCv(user.id, cv.id);
  await logAudit(user.id, 'cv.delete', String(cv.id));

  return redirect('/cv?hapus=1', 303);
};
