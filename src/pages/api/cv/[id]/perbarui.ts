import type { APIRoute } from 'astro';
import { getProfile } from '../../../../db/account';
import { getCv, recordScore, updateCv } from '../../../../db/cv';
import { logAudit } from '../../../../lib/auth';
import { refreshSectionsFromProfile } from '../../../../lib/cv-build';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fcv', 302);

  const id = Number(params.id);
  const cv = Number.isInteger(id) && id > 0 ? await getCv(user.id, id) : null;
  if (!cv) return redirect('/cv?error=tidak-ada', 303);

  const profile = await getProfile(user.id);
  const updated = await updateCv(user.id, cv.id, {
    sections: refreshSectionsFromProfile(cv.sections, profile, user.email),
    sourceProfileUpdatedAt: profile?.updatedAt ?? null,
  });
  const score = updated ? await recordScore(updated) : null;

  await logAudit(user.id, 'cv.refresh', String(cv.id), score ? `skor ${score.score}` : undefined);

  const form = await request.formData();
  const back = form.get('back') === 'list' ? '/cv?ok=diperbarui' : `/cv/${cv.id}?ok=diperbarui`;
  return redirect(back, 303);
};
