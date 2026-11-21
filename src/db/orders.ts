import { randomBytes } from 'node:crypto';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './index';
import { creditLedger, orders, users, type Order } from './schema';
import { ACTION_RESULT, canTransition, orderCode, PRODUCTS, type ProductKey } from '../lib/pricing';

export async function creditBalance(userId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${creditLedger.delta}), 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));
  return Number(row?.n ?? 0);
}

export async function creditsSpentSince(userId: number, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(creditLedger)
    .where(and(eq(creditLedger.userId, userId), eq(creditLedger.reason, 'lamaran'), gte(creditLedger.createdAt, since)));
  return Number(row?.n ?? 0);
}

export async function spendCredit(userId: number, applicationId: number): Promise<void> {
  await db.insert(creditLedger).values({ userId, delta: -1, reason: 'lamaran', applicationId });
}

export async function createOrder(userId: number, key: ProductKey): Promise<Order> {
  const p = PRODUCTS[key];
  for (let i = 0; i < 5; i++) {
    try {
      const [row] = await db
        .insert(orders)
        .values({ userId, code: orderCode((n) => randomBytes(n)), product: key, amountRp: p.priceRp, credits: p.credits })
        .returning();
      return row;
    } catch (e) {
      if (i === 4 || !String(e).includes('UNIQUE')) throw e;
    }
  }
  throw new Error('Gagal membuat kode pesanan');
}

export async function listOrders(userId: number): Promise<Order[]> {
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.id));
}

export async function openOrderCount(userId: number): Promise<number> {
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'menunggu')));
  return rows.length;
}

export async function getOrder(userId: number, id: number): Promise<Order | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function claimPaid(userId: number, id: number, note: string): Promise<boolean> {
  const order = await getOrder(userId, id);
  if (!order || order.status !== 'menunggu') return false;
  await db
    .update(orders)
    .set({ claimedAt: new Date(), payerNote: note.slice(0, 300) || null, updatedAt: new Date() })
    .where(eq(orders.id, id));
  return true;
}

export async function cancelOwnOrder(userId: number, id: number): Promise<boolean> {
  const order = await getOrder(userId, id);
  if (!order || !canTransition('batal', order.status)) return false;
  await db.update(orders).set({ status: 'batal', updatedAt: new Date() }).where(eq(orders.id, id));
  return true;
}

export async function adminOrders(statuses: string[]) {
  return db
    .select({ order: orders, email: users.email, name: users.displayName })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(inArray(orders.status, statuses))
    .orderBy(desc(orders.claimedAt), desc(orders.id));
}

// Konfirmasi menambah kredit dalam transaksi yang sama; indeks unik order_id mencegah kredit ganda.
export async function adminAct(id: number, action: string, admin: string, note: string): Promise<Order | null> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || !canTransition(action, order.status)) return null;
    const now = new Date();
    const status = ACTION_RESULT[action];
    await tx
      .update(orders)
      .set({
        status,
        adminNote: note.slice(0, 300) || order.adminNote,
        confirmedBy: admin,
        paidAt: action === 'konfirmasi' ? now : order.paidAt,
        updatedAt: now,
      })
      .where(eq(orders.id, id));
    if (action === 'konfirmasi' && order.credits > 0) {
      await tx.insert(creditLedger).values({ userId: order.userId, delta: order.credits, reason: 'pembelian', orderId: order.id });
    }
    // Produk kredit selesai begitu dibayar; jasa ditandai selesai manual setelah dikerjakan.
    if (action === 'konfirmasi' && PRODUCTS[order.product as ProductKey]?.kind === 'kredit') {
      await tx.update(orders).set({ status: 'selesai' }).where(eq(orders.id, id));
    }
    return { ...order, status };
  });
}

export function paymentInfo() {
  const env = (k: string) => String(import.meta.env?.[k] ?? process.env[k] ?? '').trim();
  return {
    bankName: env('PAYMENT_BANK_NAME'),
    accountNumber: env('PAYMENT_ACCOUNT_NUMBER'),
    accountName: env('PAYMENT_ACCOUNT_NAME'),
    qrisUrl: env('PAYMENT_QRIS_URL'),
  };
}
