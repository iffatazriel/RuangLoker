import type { APIRoute } from 'astro';
import { createCvLink, revokeCvLinks } from '../../../db/applications';
import { logAudit } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fbrankas', 302);

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const next = String(form.get('next') ?? '/brankas');
  const back = next.startsWith('/') && !next.startsWith('//') ? next : '/brankas';
  const sep = back.includes('?') ? '&' : '?';

  if (action === 'buat') {
    await createCvLink(user.id);
    await logAudit(user.id, 'tautan-cv.buat');
    return redirect(`${back}${sep}ok=tautan-baru`, 303);
  }
  if (action === 'cabut') {
    await revokeCvLinks(user.id);
    await logAudit(user.id, 'tautan-cv.cabut');
    return redirect(`${back}${sep}ok=tautan-dicabut`, 303);
  }
  return redirect(back, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
