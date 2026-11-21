import type { Job } from '../db/schema';

export const CATEGORY_LABELS: Record<string, string> = {
  Admin: 'Admin',
  Retail: 'Retail & Kasir',
  Gudang: 'Gudang',
  'F&B': 'F&B',
  Operasional: 'Operasional',
};

export const CHANNEL_LABELS: Record<string, string> = {
  Email: 'Via Email',
  WhatsApp: 'Via WhatsApp',
  'Google Form': 'Via Google Form',
  'Portal Eksternal': 'Portal Eksternal',
};

export function rupiah(n: number | null): string {
  if (n === null) return 'Tidak disebutkan';
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `Rp${jt.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  return `Rp${n.toLocaleString('id-ID')}`;
}

export function salaryRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Gaji tidak disebutkan';
  if (min !== null && max !== null) return `${rupiah(min)} – ${rupiah(max)}`;
  return rupiah(min ?? max);
}

export function relativeTime(date: Date | null): string {
  if (!date) return 'Belum diketahui';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Kemarin';
  if (days < 30) return `${days} hari lalu`;
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export type TrustLabel = {
  text: string;
  tone: 'ok' | 'warn' | 'info';
};

export function trustLabels(job: Job): TrustLabel[] {
  const labels: TrustLabel[] = [];

  if (job.isDirectEmployer) {
    labels.push({ text: 'Dari Perusahaan Langsung', tone: 'info' });
  }

  if (job.verificationStatus === 'verified') {
    labels.push({ text: `Terverifikasi · dicek ${formatDate(job.verifiedAt)}`, tone: 'ok' });
  } else if (job.verificationStatus === 'manual_checked') {
    labels.push({ text: `Dicek manual · ${formatDate(job.verifiedAt)}`, tone: 'ok' });
  }

  if (job.expiresAt) {
    const daysLeft = Math.ceil(
      (new Date(job.expiresAt).getTime() - Date.now()) / 86_400_000,
    );
    if (daysLeft <= 7) {
      labels.push({
        text: daysLeft <= 0 ? 'Kedaluwarsa' : `Berakhir dalam ${daysLeft} hari`,
        tone: 'warn',
      });
    }
  }

  return labels;
}

export function isExpired(job: Job): boolean {
  return !!job.expiresAt && new Date(job.expiresAt).getTime() < Date.now();
}

export function totalDaysLeft(job: Job): number | null {
  if (!job.expiresAt) return null;
  return Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / 86_400_000);
}
