import type { APIRoute } from 'astro';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { files as filesTable, profiles } from '../../db/schema';
import { listFiles } from '../../db/account';
import { purgeUserCvs } from '../../db/cv';
import { deleteAccount } from '../../lib/auth';
import { purgeFile } from '../../lib/vault';

export const POST: APIRoute = async ({ request, locals, session, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk', 302);

  const form = await request.formData();
  if (form.get('confirm') !== 'yes') {
    return redirect('/akun?error=konfirmasi', 303);
  }

  const files = await listFiles(user.id);

  for (const file of files) {
    await purgeFile(user.id, file.storedName);
  }

  // Akun hanya dianonimkan (soft delete), jadi baris turunan yang berisi data pribadi dibersihkan di sini.
  await db
    .update(filesTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(filesTable.userId, user.id), isNull(filesTable.deletedAt)));
  await db.delete(profiles).where(eq(profiles.userId, user.id));
  await purgeUserCvs(user.id);

  await deleteAccount(user.id);

  session?.destroy();

  return redirect('/?akun-dihapus=1', 303);
};
