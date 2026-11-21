import type { APIRoute } from 'astro';
import { access, constants } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { vaultRoot } from '../../lib/vault';

// Untuk uptime monitor / Docker healthcheck. Tidak membocorkan detail konfigurasi.
export const GET: APIRoute = async () => {
  const [dbOk, vaultOk] = await Promise.all([
    db.run(sql`select 1`).then(() => true, () => false),
    access(vaultRoot(), constants.W_OK).then(() => true, () => false),
  ]);
  const ok = dbOk && vaultOk;
  return new Response(JSON.stringify({ ok, db: dbOk, vault: vaultOk }), {
    status: ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
