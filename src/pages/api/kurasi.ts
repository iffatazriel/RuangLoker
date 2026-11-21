import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { jobs, curationLog } from '../../db/schema';

const ACTIONS = new Set(['verify', 'manual_check', 'reject', 'deactivate', 'reactivate', 'extend']);

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const form = await request.formData();

  const jobId = Number(form.get('jobId'));
  const action = String(form.get('action') ?? '');
  const note = form.get('note') ? String(form.get('note')) : null;
  const curator = locals.user?.email ?? 'admin';

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return new Response('jobId tidak valid', { status: 400 });
  }

  if (!ACTIONS.has(action)) {
    return new Response(`Aksi tidak dikenal: ${action}`, { status: 400 });
  }

  const now = new Date();
  const patch: Record<string, unknown> = { updatedAt: now };

  switch (action) {
    case 'verify':
      patch.verificationStatus = 'verified';
      patch.verifiedAt = now;
      patch.isActive = true;
      break;
    case 'manual_check':
      patch.verificationStatus = 'manual_checked';
      patch.verifiedAt = now;
      patch.isActive = true;
      break;
    case 'reject':
      patch.verificationStatus = 'rejected';
      patch.isActive = false;
      break;
    case 'deactivate':
      patch.isActive = false;
      break;
    case 'reactivate':
      patch.isActive = true;
      break;
    case 'extend':
      patch.expiresAt = new Date(now.getTime() + 30 * 86_400_000);
      break;
  }

  await db.update(jobs).set(patch).where(eq(jobs.id, jobId));

  await db.insert(curationLog).values({
    jobId,
    action,
    note,
    curator,
    createdAt: now,
  });

  return redirect(`/kelola?ok=${encodeURIComponent(action)}`);
};
