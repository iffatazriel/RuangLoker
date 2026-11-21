import { defineMiddleware } from 'astro:middleware';
import { findUserById } from './lib/auth';
import { isAdmin } from './lib/admin';

const PRIVATE_PREFIXES = ['/app', '/profil', '/cv', '/brankas', '/akun', '/lamaran', '/pesanan'];
const ADMIN_PREFIXES = ['/kelola', '/api/kurasi', '/api/admin'];
const AUTH_PAGES = new Set(['/masuk', '/daftar', '/lupa-sandi']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, session, redirect } = context;

  context.locals.user = null;

  const userId = await session?.get('userId');

  if (typeof userId === 'number') {
    const user = await findUserById(userId);
    const authAt = (await session?.get('authAt')) ?? 0;
    // Sesi yang dibuat sebelum kata sandi diganti tidak berlaku lagi.
    const stale = user?.passwordChangedAt && authAt < user.passwordChangedAt.getTime();
    if (user && !stale) {
      context.locals.user = user;
    } else {
      session?.destroy();
    }
  }

  const path = url.pathname;
  const isPrivate = PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isPrivate && !context.locals.user) {
    const next = encodeURIComponent(path + url.search);
    return redirect(`/masuk?next=${next}`, 302);
  }

  const isAdminPath = ADMIN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (isAdminPath && !context.locals.user) {
    return redirect(`/masuk?next=${encodeURIComponent(path)}`, 302);
  }
  if (isAdminPath && !isAdmin(context.locals.user)) {
    return new Response('Halaman tidak ditemukan', { status: 404 });
  }

  if (AUTH_PAGES.has(path) && context.locals.user) {
    return redirect('/app', 302);
  }

  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');

  if (isPrivate) {
    response.headers.set('Cache-Control', 'no-store, private');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  if (cookies.get('rl_session')?.value) {
    // Sesi disimpan server-side; cookie hanya membawa id.
    response.headers.append('Vary', 'Cookie');
  }

  return response;
});
