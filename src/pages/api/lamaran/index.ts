import type { APIRoute } from 'astro';
import { SUPPORTED_CHANNELS as SUPPORTED, prepareApplication } from '../../../db/applications';
import { getJobById } from '../../../db/cv';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Flowongan', 302);

  const form = await request.formData();
  const jobId = Number(form.get('jobId'));
  const job = Number.isInteger(jobId) && jobId > 0 ? await getJobById(jobId) : null;
  if (!job || !job.isActive || !['verified', 'manual_checked'].includes(job.verificationStatus)) {
    return redirect('/lowongan?error=lowongan', 303);
  }
  if (job.expiresAt && job.expiresAt.getTime() < Date.now()) return redirect(`/lowongan/${job.slug}?error=kedaluwarsa`, 303);
  if (!SUPPORTED.has(job.applyChannel)) return redirect(`/lowongan/${job.slug}?error=kanal`, 303);

  const res = await prepareApplication(user, job);
  if ('error' in res) return redirect('/lamaran?error=kuota', 303);
  return redirect(`/lamaran/${res.app.id}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
