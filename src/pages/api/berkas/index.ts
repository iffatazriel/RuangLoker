import type { APIRoute } from 'astro';
import { hasSensitiveConsent, storeFileReplacingKind } from '../../../db/account';
import { logAudit } from '../../../lib/auth';
import { FILE_KINDS, extensionFor, isAllowedUpload } from '../../../lib/vault';

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

  const buffer = Buffer.from(await upload.arrayBuffer());
  const stored = await storeFileReplacingKind(user.id, {
    kind,
    originalName: upload.name,
    mimeType: upload.type,
    extension: extensionFor(upload.type),
    data: buffer,
  });

  if (!stored.ok) {
    return redirect('/brankas?error=kuota', 303);
  }

  await logAudit(user.id, 'file.upload', kind, `${stored.file.sizeBytes} bytes`);

  return redirect(`/brankas?ok=${encodeURIComponent(meta.label)}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
