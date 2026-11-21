import type { APIRoute } from 'astro';
import { cancelOwnOrder, claimPaid, createOrder, openOrderCount } from '../../../db/orders';
import { logAudit } from '../../../lib/auth';
import { formatRp, isProductKey, PRODUCTS } from '../../../lib/pricing';
import { notifyAdmins } from '../../../lib/notify';
import { appOrigin } from '../../../lib/mail';
import { getOrder } from '../../../db/orders';

const MAX_OPEN_ORDERS = 3;

export const POST: APIRoute = async ({ request, locals, redirect, url }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fpaket', 302);

  const form = await request.formData();
  const action = String(form.get('action') ?? '');

  if (action === 'buat') {
    const product = form.get('product');
    if (!isProductKey(product)) return redirect('/paket', 303);
    if ((await openOrderCount(user.id)) >= MAX_OPEN_ORDERS) return redirect('/pesanan?error=terbuka', 303);
    const order = await createOrder(user.id, product);
    await logAudit(user.id, 'pesanan.buat', order.code, product);
    return redirect(`/pesanan?baru=${order.id}`, 303);
  }

  const id = Number(form.get('orderId'));
  if (!Number.isInteger(id) || id <= 0) return redirect('/pesanan', 303);

  if (action === 'sudah-bayar') {
    const ok = await claimPaid(user.id, id, String(form.get('note') ?? '').trim());
    if (ok) {
      await logAudit(user.id, 'pesanan.klaim-bayar', String(id));
      const order = await getOrder(user.id, id);
      if (order) {
        await notifyAdmins(`Pembayaran diklaim ${order.code}`, [
          `${user.displayName} <${user.email}> menandai sudah membayar.`,
          `Pesanan: ${order.code} · ${PRODUCTS[order.product as keyof typeof PRODUCTS]?.name ?? order.product} · ${formatRp(order.amountRp)}`,
          `Catatan pembayar: ${order.payerNote ?? '-'}`,
          '',
          `Cocokkan dengan mutasi lalu konfirmasi di ${appOrigin(url, import.meta.env.PROD)}/kelola/pesanan`,
        ]);
      }
    }
    return redirect(`/pesanan?ok=${ok ? 'klaim' : 'gagal'}`, 303);
  }
  if (action === 'batal') {
    const ok = await cancelOwnOrder(user.id, id);
    if (ok) await logAudit(user.id, 'pesanan.batal', String(id));
    return redirect(`/pesanan?ok=${ok ? 'batal' : 'gagal'}`, 303);
  }
  return redirect('/pesanan', 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
