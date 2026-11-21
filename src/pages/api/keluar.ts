import type { APIRoute } from 'astro';
import { logAudit } from '../../lib/auth';

export const POST: APIRoute = async ({ session, redirect, locals }) => {
  const user = locals.user;

  if (user) {
    await logAudit(user.id, 'auth.logout');
  }

  session?.destroy();
  return redirect('/', 303);
};

export const GET: APIRoute = async ({ redirect }) => redirect('/app', 303);
