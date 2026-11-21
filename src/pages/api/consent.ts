import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { files } from '../../db/schema';
import { listFiles } from '../../db/account';
import { logAudit, recordConsents, revokeConsent } from '../../lib/auth';
import { purgeFile } from '../../lib/vault';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fakun', 302);

  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');

  if (intent === 'grant') {
    await recordConsents(
      user.id,
      { data_sensitif: true },
      `${request.headers.get('user-agent') ?? 'unknown'} · ${new Date().toISOString()}`,
    );
    await logAudit(user.id, 'consent.grant', 'data_sensitif');
    return redirect('/akun?ok=consent-grant', 303);
  }

  if (intent === 'revoke') {
    await revokeConsent(user.id, 'data_sensitif');

    // Mencabut consent harus benar-benar menghapus berkasnya, bukan sekadar menandai.
    const sensitive = (await listFiles(user.id)).filter((f) => f.isSensitive);

    for (const file of sensitive) {
      await purgeFile(user.id, file.storedName);
      await db
        .update(files)
        .set({ deletedAt: new Date() })
        .where(and(eq(files.id, file.id), eq(files.userId, user.id)));
    }

    await logAudit(user.id, 'consent.revoke', 'data_sensitif', `${sensitive.length} berkas dihapus`);

    return redirect(`/akun?ok=consent-revoke&hapus=${sensitive.length}`, 303);
  }

  return redirect('/akun?error=intent', 303);
};
