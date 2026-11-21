// Cadangan database + brankas dalam satu folder bertanggal. Jalankan lewat cron, lalu salin ke luar server.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
try {
  process.loadEnvFile();
} catch {
  // .env opsional; variabel bisa datang dari environment server.
}

const dbUrl = process.env.DATABASE_URL ?? 'file:./data/ruangloker.db';
const vaultDir = resolve(process.env.VAULT_DIR ?? './data/vault');
const root = resolve(process.env.BACKUP_DIR ?? './backups');
const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 14));

if (!dbUrl.startsWith('file:')) {
  console.error('Backup ini hanya untuk database SQLite lokal (DATABASE_URL=file:...).');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
const target = join(root, stamp);
mkdirSync(target, { recursive: true });

// VACUUM INTO menghasilkan salinan konsisten walau aplikasi sedang menulis.
const client = createClient({ url: dbUrl });
const dbFile = join(target, 'ruangloker.db');
await client.execute({ sql: 'VACUUM INTO ?', args: [dbFile] });
client.close();

if (existsSync(vaultDir)) cpSync(vaultDir, join(target, 'vault'), { recursive: true });

const old = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{8}-\d{4}$/.test(d.name))
  .map((d) => d.name)
  .sort()
  .slice(0, -keep);
for (const name of old) rmSync(join(root, name), { recursive: true, force: true });

console.log(`Backup selesai: ${target} (menyimpan ${keep} terakhir, ${old.length} lama dihapus).`);
