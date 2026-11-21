import type { APIRoute } from 'astro';
import { listFiles } from '../../db/account';
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

  await deleteAccount(user.id);

  session?.destroy();

  return redirect('/?akun-dihapus=1', 303);
};
