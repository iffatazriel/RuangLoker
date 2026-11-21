import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { files } from '../../../../db/schema';
import { getFile } from '../../../../db/account';
import { logAudit } from '../../../../lib/auth';
import { purgeFile } from '../../../../lib/vault';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fbrankas', 302);

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return redirect('/brankas?error=id', 303);
  }

  const file = await getFile(user.id, id);
  if (!file) return redirect('/brankas?error=tidak-ada', 303);

  // Hapus fisik dulu; kalau gagal, record tetap ada agar tidak jadi yatim.
  await purgeFile(user.id, file.storedName);

  await db
    .update(files)
    .set({ deletedAt: new Date() })
    .where(and(eq(files.id, id), eq(files.userId, user.id)));

  await logAudit(user.id, 'file.delete', file.kind);

  return redirect('/brankas?hapus=1', 303);
};
