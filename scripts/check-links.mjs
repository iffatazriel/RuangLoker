// Cek harian tautan sumber lowongan aktif. Jalankan lewat cron: npm run jobs:check-links
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { checkJobLinks } from '../src/lib/link-check.ts';
import { sendMail } from '../src/lib/mail.ts';

try {
  process.loadEnvFile();
} catch {
  // .env opsional.
}

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/ruangloker.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});
const summary = await checkJobLinks(drizzle(client));
console.log(`[cek-tautan] ${summary.checked} dicek, ${summary.flagged.length} bermasalah, ${summary.newlyFlagged} baru.`);

const admins = String(process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
if (summary.newlyFlagged > 0 && admins.length > 0) {
  const label = { mati: 'tautan mati', ditutup: 'sudah ditutup', gagal: 'gagal dibuka 3 kali' };
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  await sendMail({
    to: admins,
    subject: `[RuangLoker] ${summary.newlyFlagged} tautan lowongan bermasalah`,
    text: [
      'Cek tautan harian menemukan lowongan yang sumbernya bermasalah:',
      '',
      ...summary.flagged.map((f) => `- ${f.title} (${label[f.status] ?? f.status})`),
      '',
      `Tinjau dan turunkan di ${appUrl}/kelola#tautan`,
    ].join('\n'),
  });
}
client.close();
