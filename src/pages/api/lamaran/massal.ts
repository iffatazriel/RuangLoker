import type { APIRoute } from 'astro';
import { isPreparable, MAX_QUEUE, prepareApplication } from '../../../db/applications';
import { getJobById } from '../../../db/cv';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Flowongan', 302);

  const form = await request.formData();
  const jobIds = [...new Set(form.getAll('jobId').map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  if (jobIds.length === 0) return redirect('/lowongan?error=pilih', 303);
  if (jobIds.length > MAX_QUEUE) return redirect('/lowongan?error=maks', 303);

  const queue: number[] = [];
  let skipped = 0;
  let quotaHit = false;
  for (const id of jobIds) {
    const job = await getJobById(id);
    if (!job || !isPreparable(job)) {
      skipped++;
      continue;
    }
    const res = await prepareApplication(user, job);
    if ('error' in res) {
      quotaHit = true;
      continue;
    }
    queue.push(res.app.id);
  }

  if (queue.length === 0) return redirect(quotaHit ? '/lamaran?error=kuota' : '/lowongan?error=pilih', 303);
  const flags = [quotaHit && 'kuota=1', skipped && `lewat=${skipped}`].filter(Boolean).join('&');
  return redirect(`/lamaran/antrean?ids=${queue.join(',')}${flags ? `&${flags}` : ''}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
