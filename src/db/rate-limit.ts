import { eq, lt } from 'drizzle-orm';
import { db } from './index';
import { rateLimits } from './schema';
import { clientIp, stepRate, type RateDecision } from '../lib/rate-limit';
import { env } from '../lib/env';

export async function hitRate(key: string, limit: number, windowSec: number): Promise<RateDecision> {
  const now = Date.now();
  const [prev] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  const decision = stepRate(prev ?? null, now, limit, windowSec * 1000);
  await db
    .insert(rateLimits)
    .values({ key, ...decision.state })
    .onConflictDoUpdate({ target: rateLimits.key, set: decision.state });
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, now));
  return decision;
}

export async function clearRate(key: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

export function requestIp(request: Request, clientAddress: string | undefined): string {
  return clientIp(request.headers, clientAddress, env('TRUST_PROXY') === '1');
}
