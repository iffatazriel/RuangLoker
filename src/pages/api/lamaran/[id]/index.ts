import type { APIRoute } from 'astro';
import { getProfile } from '../../../../db/account';
import { applicantFor, composeFor, getApplication, updateApplication } from '../../../../db/applications';
import { getJobById } from '../../../../db/cv';
import { logAudit } from '../../../../lib/auth';
import { isLetterTemplate, isLetterTone, restoreCvLinkPlaceholder } from '../../../../lib/letter';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Flamaran', 302);

  const id = Number(params.id);
  const app = Number.isInteger(id) && id > 0 ? await getApplication(user.id, id) : null;
  if (!app) return redirect('/lamaran?error=tidak-ada', 303);

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const back = `/lamaran/${app.id}`;

  if (action === 'simpan') {
    const subject = String(form.get('subject') ?? '').trim().slice(0, 200);
    const raw = String(form.get('body') ?? '').replace(/\r\n/g, '\n').trim().slice(0, 6000);
    const body = app.channel === 'WhatsApp' ? restoreCvLinkPlaceholder(raw) : raw;
    if (!subject || !body) return redirect(`${back}?error=kosong`, 303);
    await updateApplication(user.id, app.id, { subject, body });
    await logAudit(user.id, 'lamaran.ubah', String(app.id));
    return redirect(`${back}?ok=disimpan`, 303);
  }

  if (action === 'susun') {
    const template = form.get('template');
    const tone = form.get('tone');
    if (!isLetterTemplate(template) || !isLetterTone(tone)) return redirect(`${back}?error=template`, 303);
    const job = await getJobById(app.jobId);
    if (!job) return redirect(`${back}?error=lowongan`, 303);
    const { applicant, cvId } = await applicantFor(user.id, await getProfile(user.id), user.email);
    const { subject, body } = composeFor(job, applicant, template, tone);
    await updateApplication(user.id, app.id, { template, tone, subject, body, cvId });
    await logAudit(user.id, 'lamaran.susun', String(app.id), `${template} · ${tone}`);
    return redirect(`${back}?ok=disusun`, 303);
  }

  if (action === 'terkirim' && app.status !== 'terkirim') {
    await updateApplication(user.id, app.id, { status: 'terkirim', sentAt: new Date() });
    await logAudit(user.id, 'lamaran.terkirim', String(app.id), `${app.jobTitle} · ${app.company}`);
    const next = String(form.get('next') ?? '');
    return redirect(next.startsWith('/lamaran') ? next : `${back}?ok=terkirim`, 303);
  }

  if (action === 'batal' && app.status === 'draf') {
    await updateApplication(user.id, app.id, { status: 'batal' });
    await logAudit(user.id, 'lamaran.batal', String(app.id));
    return redirect('/lamaran?ok=batal', 303);
  }

  return redirect(back, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
