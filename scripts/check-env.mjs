// Dijalankan sebelum server produksi start. Berhenti dengan kode 1 kalau konfigurasi wajib belum benar.
import { existsSync, mkdirSync, accessSync, constants, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@libsql/client';

try {
  process.loadEnvFile();
} catch {
  // .env opsional; variabel bisa datang dari environment server.
}

const v = (k) => String(process.env[k] ?? '').trim();
const errors = [];
const warnings = [];

if (v('VAULT_SECRET').length < 32) errors.push('VAULT_SECRET minimal 32 karakter (lihat .env.example).');
if (!/^https:\/\//.test(v('APP_URL'))) errors.push('APP_URL wajib diisi dengan https://, mis. https://ruangloker.id.');
if (!v('ADMIN_EMAILS')) errors.push('ADMIN_EMAILS kosong: tidak ada yang bisa membuka panel kurasi dan konfirmasi pembayaran.');

if (!v('RESEND_API_KEY') || !v('MAIL_FROM')) warnings.push('RESEND_API_KEY/MAIL_FROM kosong: email reset sandi dan notifikasi hanya tercetak di log.');
if (!v('PAYMENT_ACCOUNT_NUMBER') && !v('PAYMENT_QRIS_URL')) warnings.push('Info pembayaran kosong: pengguna diminta tidak transfer dulu.');
if (!v('CONTACT_EMAIL')) warnings.push('CONTACT_EMAIL kosong: halaman privasi mengarahkan ke formulir laporan.');
if (v('TRUST_PROXY') !== '1') warnings.push('TRUST_PROXY bukan 1: kalau di belakang Caddy/Nginx, semua pengguna dihitung satu IP untuk batas percobaan.');

const vaultDir = resolve(v('VAULT_DIR') || './data/vault');
try {
  mkdirSync(vaultDir, { recursive: true });
  accessSync(vaultDir, constants.W_OK);
} catch {
  errors.push(`VAULT_DIR ${vaultDir} tidak bisa ditulis.`);
}

const dbUrl = v('DATABASE_URL') || 'file:./data/ruangloker.db';
try {
  const client = createClient({ url: dbUrl, authToken: v('DATABASE_AUTH_TOKEN') || undefined });
  const journal = JSON.parse(readFileSync('./drizzle/meta/_journal.json', 'utf8'));
  const applied = await client
    .execute('select count(*) as n from __drizzle_migrations')
    .then((r) => Number(r.rows[0].n))
    .catch(() => 0);
  if (applied < journal.entries.length) errors.push(`Migrasi database belum lengkap (${applied}/${journal.entries.length}). Jalankan: npm run db:migrate`);
  client.close();
} catch (e) {
  errors.push(`Database ${dbUrl} tidak bisa dibuka: ${e.message}`);
}

if (!existsSync('./dist/server/entry.mjs')) errors.push('Belum ada hasil build. Jalankan: npm run build');

for (const w of warnings) console.warn(`[cek-env] peringatan: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`[cek-env] GAGAL: ${e}`);
  process.exit(1);
}
console.log("[cek-env] konfigurasi produksi OK.");
