import type { APIRoute } from 'astro';
import { getProfile } from '../../../db/account';
import { createCv, recordScore } from '../../../db/cv';
import { findJobs } from '../../../db/queries';
import { logAudit } from '../../../lib/auth';
import { buildSectionsFromProfile } from '../../../lib/cv-build';

export const POST: APIRoute = async ({ locals, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/masuk?next=%2Fcv', 302);

  const profile = await getProfile(user.id);
  const sections = buildSectionsFromProfile(profile, user.email);
  // Lowongan aktif pertama yang judulnya cocok dengan posisi yang dituju, supaya kata kunci
  // langsung bisa dinilai. Pengguna bisa mengganti atau mengosongkannya di halaman CV.
  const role = sections.targetRole.toLowerCase();
  const candidates = role ? await findJobs({ q: sections.targetRole, limit: 20 }) : [];
  const autoJob = candidates.find((j) => j.title.toLowerCase().includes(role)) ?? null;

  const cv = await createCv(user.id, {
    kind: 'ats',
    sections,
    sourceProfileUpdatedAt: profile?.updatedAt ?? null,
    targetJobId: autoJob?.id ?? null,
  });
  const score = await recordScore(cv);

  await logAudit(user.id, 'cv.create', String(cv.id), `skor ${score.score}`);

  return redirect(`/cv/${cv.id}?ok=${autoJob ? 'dibuat-target' : 'dibuat'}`, 303);
};

export const GET: APIRoute = async () => new Response('Gunakan POST.', { status: 405 });
