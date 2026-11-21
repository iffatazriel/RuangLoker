import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { checkJobLinks } from '../../../lib/link-check';
import { logAudit } from '../../../lib/auth';

export const POST: APIRoute = async ({ redirect, locals }) => {
  const summary = await checkJobLinks(db);
  await logAudit(locals.user!.id, 'admin.lowongan.cek-tautan', `${summary.checked}/${summary.flagged.length}`);
  return redirect(`/kelola?ok=cek-tautan&n=${summary.checked}#tautan`, 303);
};
