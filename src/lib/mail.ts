import { env } from './env.ts';

export type MailInput = { to: string | string[]; subject: string; text: string };
export type MailResult = { sent: boolean; reason?: string };

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function mailConfigured(): boolean {
  return Boolean(env('RESEND_API_KEY') && env('MAIL_FROM'));
}

// Tanpa RESEND_API_KEY, email dicetak ke log server agar alur tetap bisa dicoba di lokal.
export async function sendMail(input: MailInput): Promise<MailResult> {
  const to = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
  if (to.length === 0) return { sent: false, reason: 'no-recipient' };

  if (!mailConfigured()) {
    console.info(`[mail:log] to=${to.join(',')} subject=${input.subject}\n${input.text}`);
    return { sent: false, reason: 'not-configured' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env('MAIL_FROM'), to, subject: input.subject, text: input.text }),
    });
    if (!res.ok) {
      console.error(`[mail] Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('[mail] gagal mengirim:', err);
    return { sent: false, reason: 'network' };
  }
}

// Origin untuk tautan di email. Di produksi wajib APP_URL agar header Host tidak bisa dipalsukan.
export function appOrigin(requestUrl: URL, isProd: boolean): string {
  const configured = env('APP_URL').replace(/\/+$/, '');
  if (configured) return configured;
  return isProd ? 'https://ruangloker.id' : requestUrl.origin;
}

const SIGNOFF = '\n\nSalam,\nRuangLoker — Satu Ruang, Semua Lamaran';

export function resetPasswordEmail(name: string, link: string, minutes: number): Omit<MailInput, 'to'> {
  return {
    subject: 'Atur ulang kata sandi RuangLoker',
    text:
      `Halo ${name},\n\nAda permintaan untuk mengatur ulang kata sandi akun RuangLoker kamu. ` +
      `Buka tautan ini dalam ${minutes} menit:\n\n${link}\n\n` +
      'Tautan hanya bisa dipakai sekali. Kalau kamu tidak merasa meminta, abaikan email ini; kata sandimu tidak berubah.' +
      SIGNOFF,
  };
}

export function passwordChangedEmail(name: string): Omit<MailInput, 'to'> {
  return {
    subject: 'Kata sandi RuangLoker sudah diganti',
    text:
      `Halo ${name},\n\nKata sandi akun RuangLoker kamu baru saja diganti, dan semua perangkat yang masih masuk sudah dikeluarkan. ` +
      'Kalau bukan kamu yang menggantinya, segera atur ulang lewat halaman "Lupa kata sandi" dan hubungi kami.' +
      SIGNOFF,
  };
}
