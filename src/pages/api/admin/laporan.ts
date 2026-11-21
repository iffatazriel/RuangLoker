import type { APIRoute } from 'astro';
import { resolveReport } from '../../../db/reports';
import { logAudit } from '../../../lib/auth';
import { isAdmin } from '../../../lib/admin';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user || !isAdmin(user)) return new Response('Halaman tidak ditemukan', { status: 404 });

  const form = await request.formData();
  const id = Number(form.get('reportId'));
  const status = String(form.get('status') ?? '');
  if (!Number.isInteger(id) || id <= 0 || (status !== 'ditindak' && status !== 'diabaikan')) {
    return redirect('/kelola', 303);
  }
  const ok = await resolveReport(id, status, user.email);
  if (ok) await logAudit(user.id, `admin.laporan.${status}`, String(id));
  return redirect(`/kelola?ok=${ok ? `laporan-${status}` : 'laporan-gagal'}#laporan`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
