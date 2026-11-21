import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { files } from '../../../db/schema';
import { hasSensitiveConsent, listFiles, storageUsed } from '../../../db/account';
import { logAudit } from '../../../lib/auth';
import {
  FILE_KINDS,
  extensionFor,
  isAllowedUpload,
  purgeFile,
  sealFile,
  storedNameFor,
} from '../../../lib/vault';

const FREE_QUOTA_BYTES = 50 * 1024 * 1024;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;

  if (!user) {
    return redirect('/masuk?next=%2Fbrankas', 302);
  }

  const form = await request.formData();
  const kind = String(form.get('kind') ?? '');
  const upload = form.get('file');

  if (!(kind in FILE_KINDS)) {
    return redirect('/brankas?error=jenis', 303);
  }

  if (!(upload instanceof File)) {
    return redirect('/brankas?error=berkas', 303);
  }

  const meta = FILE_KINDS[kind];

  const check = isAllowedUpload(upload.type, upload.size);
  if (!check.ok) {
    return redirect(`/brankas?error=${encodeURIComponent(check.reason)}`, 303);
  }

  if (meta.sensitive && !(await hasSensitiveConsent(user.id))) {
    return redirect('/brankas?error=consent', 303);
  }

  const existing = await listFiles(user.id);
  const usedAfterReplace =
    storageUsed(existing.filter((f) => f.kind !== kind));

  if (usedAfterReplace + upload.size > FREE_QUOTA_BYTES) {
    return redirect('/brankas?error=kuota', 303);
  }

  const buffer = Buffer.from(await upload.arrayBuffer());
  const storedName = storedNameFor(extensionFor(upload.type));
  const sealed = await sealFile(user.id, storedName, buffer);

  // Satu slot per jenis berkas: unggahan baru menggantikan yang lama,
  // bukan menumpuk. Tanpa ini brankas bisa berisi lima versi CV.
  const superseded = existing.filter((f) => f.kind === kind);

  for (const old of superseded) {
    await purgeFile(user.id, old.storedName);
    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(and(eq(files.id, old.id), eq(files.userId, user.id)));
  }

  await db.insert(files).values({
    userId: user.id,
    kind,
    label: meta.label,
    originalName: upload.name.slice(0, 200),
    storedName,
    mimeType: upload.type,
    sizeBytes: sealed.sizeBytes,
    iv: sealed.iv,
    authTag: sealed.authTag,
    sha256: sealed.sha256,
    isSensitive: meta.sensitive,
    isPrimary: true,
  });

  await logAudit(user.id, 'file.upload', kind, `${sealed.sizeBytes} bytes`);

  return redirect(`/brankas?ok=${encodeURIComponent(meta.label)}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
