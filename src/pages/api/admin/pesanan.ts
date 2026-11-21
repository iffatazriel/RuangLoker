import type { APIRoute } from 'astro';
import { adminAct } from '../../../db/orders';
import { logAudit } from '../../../lib/auth';
import { isAdmin } from '../../../lib/admin';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user || !isAdmin(user)) return new Response('Halaman tidak ditemukan', { status: 404 });

  const form = await request.formData();
  const id = Number(form.get('orderId'));
  const action = String(form.get('action') ?? '');
  if (!Number.isInteger(id) || id <= 0) return redirect('/kelola/pesanan', 303);

  const order = await adminAct(id, action, user.email, String(form.get('note') ?? '').trim());
  if (!order) return redirect('/kelola/pesanan?error=status', 303);
  await logAudit(user.id, `admin.pesanan.${action}`, order.code, `user ${order.userId}`);
  return redirect(`/kelola/pesanan?ok=${action}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
