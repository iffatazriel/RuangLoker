export type RateState = { count: number; resetAt: number };
export type RateDecision = { ok: boolean; state: RateState; retryAfterSec: number };

// Jendela tetap: hitungan direset setelah resetAt lewat.
export function stepRate(prev: RateState | null, now: number, limit: number, windowMs: number): RateDecision {
  const fresh = !prev || prev.resetAt <= now;
  const state = fresh ? { count: 1, resetAt: now + windowMs } : { count: prev.count + 1, resetAt: prev.resetAt };
  const ok = state.count <= limit;
  return { ok, state, retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((state.resetAt - now) / 1000)) };
}

// Di belakang reverse proxy (Nginx/Caddy), set TRUST_PROXY=1 agar IP diambil dari X-Forwarded-For.
export function clientIp(headers: Headers, clientAddress: string | undefined, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  return clientAddress || 'unknown';
}

export function retryText(sec: number): string {
  const minutes = Math.ceil(sec / 60);
  return minutes <= 1 ? 'sekitar 1 menit' : `${minutes} menit`;
}
