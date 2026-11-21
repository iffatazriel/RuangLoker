import { env } from './env';

// Admin ditentukan lewat ADMIN_EMAILS (dipisah koma). Kosong berarti tidak ada admin.
export function adminEmails(): string[] {
  const raw = env('ADMIN_EMAILS');
  return String(raw)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(user: { email: string } | null | undefined): boolean {
  return !!user && adminEmails().includes(user.email.toLowerCase());
}
