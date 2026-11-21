import type { APIRoute } from 'astro';
import { adminAct } from '../../../db/orders';
import { findUserById, logAudit } from '../../../lib/auth';
import { appOrigin, sendMail } from '../../../lib/mail';
import { formatRp, PRODUCTS, type ProductKey } from '../../../lib/pricing';
import { isAdmin } from '../../../lib/admin';

export const POST: APIRoute = async ({ request, locals, redirect, url }) => {
  const user = locals.user;
  if (!user || !isAdmin(user)) return new Response('Halaman tidak ditemukan', { status: 404 });

  const form = await request.formData();
  const id = Number(form.get('orderId'));
  const action = String(form.get('action') ?? '');
  if (!Number.isInteger(id) || id <= 0) return redirect('/kelola/pesanan', 303);

  const order = await adminAct(id, action, user.email, String(form.get('note') ?? '').trim());
  if (!order) return redirect('/kelola/pesanan?error=status', 303);
  await logAudit(user.id, `admin.pesanan.${action}`, order.code, `user ${order.userId}`);

  const buyer = await findUserById(order.userId);
  const product = PRODUCTS[order.product as ProductKey];
  const message: Record<string, string> = {
    konfirmasi: product?.credits
      ? `Pembayaran ${formatRp(order.amountRp)} untuk ${order.code} sudah kami terima. ${product.credits} kredit lamaran sudah masuk ke akunmu.`
      : `Pembayaran ${formatRp(order.amountRp)} untuk ${order.code} sudah kami terima. Pesanan ${product?.name ?? ''} sedang kami kerjakan; hasilnya kami kirim ke email ini.`,
    tolak: `Pembayaran untuk ${order.code} belum bisa kami cocokkan dengan mutasi rekening/QRIS. Balas email ini dengan bukti transfer, atau buat pesanan baru.`,
    selesai: `Pesanan ${order.code} (${product?.name ?? order.product}) sudah selesai.`,
  };
  if (buyer && message[action]) {
    await sendMail({
      to: buyer.email,
      subject: `Pesanan ${order.code}: ${action === 'tolak' ? 'pembayaran belum cocok' : action === 'selesai' ? 'selesai' : 'pembayaran diterima'}`,
      text: `Halo ${buyer.displayName},\n\n${message[action]}\n\nRiwayat pesanan: ${appOrigin(url, import.meta.env.PROD)}/pesanan\n\nSalam,\nRuangLoker`,
    });
  }
  return redirect(`/kelola/pesanan?ok=${action}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
