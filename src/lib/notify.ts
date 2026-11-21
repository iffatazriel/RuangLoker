import { adminEmails } from './admin';
import { sendMail } from './mail';

// Notifikasi internal ke semua ADMIN_EMAILS. Gagal kirim tidak boleh menggagalkan aksi pengguna.
export async function notifyAdmins(subject: string, lines: string[]): Promise<void> {
  const to = adminEmails();
  if (to.length === 0) return;
  await sendMail({ to, subject: `[RuangLoker] ${subject}`, text: lines.join('\n') });
}
