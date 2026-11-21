// Katalog harga. Angka ini hipotesis blueprint dan bisa diubah tanpa migrasi.

export type ProductKey = 'kredit10' | 'review_cv' | 'cv_ats' | 'bundle';

export type Product = {
  key: ProductKey;
  name: string;
  priceRp: number;
  credits: number;
  kind: 'kredit' | 'jasa';
  summary: string;
  includes: string[];
};

export const PRODUCTS: Record<ProductKey, Product> = {
  kredit10: {
    key: 'kredit10',
    name: 'Kredit Lamaran',
    priceRp: 10_000,
    credits: 10,
    kind: 'kredit',
    summary: '10 lamaran tambahan setelah kuota Gratis habis.',
    includes: ['Berlaku tanpa batas waktu', 'Dipakai otomatis setelah 3 lamaran gratis bulan ini terpakai'],
  },
  review_cv: {
    key: 'review_cv',
    name: 'Review CV oleh manusia',
    priceRp: 49_000,
    credits: 0,
    kind: 'jasa',
    summary: 'CV-mu dibaca dan diberi catatan perbaikan tertulis.',
    includes: ['Catatan per bagian CV', 'Dikirim ke email akun dalam 2 hari kerja setelah pembayaran dikonfirmasi'],
  },
  cv_ats: {
    key: 'cv_ats',
    name: 'Jasa pembuatan CV ATS',
    priceRp: 75_000,
    credits: 0,
    kind: 'jasa',
    summary: 'CV ATS disusun ulang dari profil dan riwayatmu.',
    includes: ['Satu kali revisi', 'Hasil disimpan sebagai CV di akunmu'],
  },
  bundle: {
    key: 'bundle',
    name: 'Lamaran Siap Kirim',
    priceRp: 99_000,
    credits: 10,
    kind: 'jasa',
    summary: 'Review CV, surat lamaran untuk 3 posisi, dan 10 kredit lamaran.',
    includes: ['Review CV oleh manusia', 'Surat lamaran dirapikan untuk 3 lowongan pilihanmu', '10 kredit lamaran'],
  },
};

export function isProductKey(v: unknown): v is ProductKey {
  return typeof v === 'string' && Object.hasOwn(PRODUCTS, v);
}

export function formatRp(n: number): string {
  return `Rp${n.toLocaleString('id-ID')}`;
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Kode pesanan untuk berita transfer; tanpa huruf/angka yang mirip (O/0, I/1, L).
export function orderCode(random: (n: number) => Uint8Array): string {
  const bytes = random(5);
  return `RL-${Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`;
}

export type OrderStatus = 'menunggu' | 'dibayar' | 'selesai' | 'ditolak' | 'batal';

const TRANSITIONS: Record<string, OrderStatus[]> = {
  konfirmasi: ['menunggu'],
  tolak: ['menunggu'],
  selesai: ['dibayar'],
  batal: ['menunggu'],
};

export const ACTION_RESULT: Record<string, OrderStatus> = {
  konfirmasi: 'dibayar',
  tolak: 'ditolak',
  selesai: 'selesai',
  batal: 'batal',
};

export function canTransition(action: string, from: string): boolean {
  return (TRANSITIONS[action] ?? []).includes(from as OrderStatus);
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  menunggu: 'Menunggu pembayaran',
  dibayar: 'Dibayar',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  batal: 'Dibatalkan',
};
