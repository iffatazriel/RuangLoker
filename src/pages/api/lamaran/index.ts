import type { APIRoute } from 'astro';
import { getProfile } from '../../../db/account';
import { applicantFor, composeFor, createApplication, findOpenApplication, quotaState } from '../../../db/applications';
import { getJobById } from '../../../db/cv';
import { logAudit } from '../../../lib/auth';
import type { LetterTemplate } from '../../../lib/letter';

const SUPPORTED = new Set(['Email', 'WhatsApp', 'Google Form']);

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

  const open = await findOpenApplication(user.id, job.id);
  if (open) return redirect(`/lamaran/${open.id}`, 303);

  const quota = await quotaState(user.id);
  if (quota.remaining <= 0) return redirect(`/lamaran?error=kuota`, 303);

  const profile = await getProfile(user.id);
  const { applicant, cvId } = await applicantFor(user.id, profile, user.email);
  const template: LetterTemplate = job.category === 'Admin' ? (applicant.experience ? 'formal' : 'fresh') : 'retail';
  const { subject, body } = composeFor(job, applicant, template, 'formal');

  const app = await createApplication({
    userId: user.id,
    jobId: job.id,
    cvId,
    jobTitle: job.title,
    company: job.company,
    channel: job.applyChannel,
    target: job.applyTarget,
    template,
    tone: 'formal',
    subject,
    body,
  });
  await logAudit(user.id, 'lamaran.siapkan', String(app.id), `${job.title} · ${job.company}`);

  return redirect(`/lamaran/${app.id}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
