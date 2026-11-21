import { defineMiddleware } from 'astro:middleware';
import { findUserById } from './lib/auth';

const PRIVATE_PREFIXES = ['/app', '/profil', '/brankas', '/akun'];
const AUTH_PAGES = new Set(['/masuk', '/daftar']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, session, redirect } = context;

  context.locals.user = null;

  const userId = await session?.get('userId');

  if (typeof userId === 'number') {
    const user = await findUserById(userId);
    if (user) {
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
