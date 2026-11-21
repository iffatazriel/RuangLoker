import type { APIRoute } from 'astro';
import { getProfile } from '../../../db/account';
import { createCv, recordScore } from '../../../db/cv';
import { logAudit } from '../../../lib/auth';
import { buildSectionsFromProfile } from '../../../lib/cv-build';

export const POST: APIRoute = async ({ locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fcv', 302);

  const profile = await getProfile(user.id);
  const cv = await createCv(user.id, {
    kind: 'ats',
    sections: buildSectionsFromProfile(profile, user.email),
    sourceProfileUpdatedAt: profile?.updatedAt ?? null,
  });
  const score = await recordScore(cv);

  await logAudit(user.id, 'cv.create', String(cv.id), `skor ${score.score}`);

  return redirect(`/cv/${cv.id}?ok=dibuat`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
