import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

const isProduction = (): boolean => {
  // Astro menyalakan NODE_ENV=production bahkan saat `astro dev`, jadi
  // jangan pakai NODE_ENV. import.meta.env.PROD hanya true untuk build.
  if (typeof import.meta.env?.PROD === 'boolean') return import.meta.env.PROD;
  return process.env.NODE_ENV === 'production';
};

function readSecret(): string {
  const secret = import.meta.env?.VAULT_SECRET ?? process.env.VAULT_SECRET;

  if (!secret) {
    if (isProduction()) {
      throw new Error(
        'VAULT_SECRET wajib diisi. Buat dengan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      );
    }
    return 'dev-only-vault-secret-jangan-dipakai-di-produksi';
  }

  if (isProduction() && secret.length < 32) {
    throw new Error('VAULT_SECRET minimal 32 karakter di produksi.');
  }

  return secret;
}

let cachedKey: Buffer | null = null;

function key(): Buffer {
  cachedKey ??= scryptSync(readSecret().normalize('NFKC'), 'ruangloker-vault-v1', 32);
  return cachedKey;
}

export function vaultRoot(): string {
  return resolve(process.env.VAULT_DIR ?? './data/vault');
}

export function storedNameFor(extension: string): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').slice(0, 5).toLowerCase() || 'bin';
  return `${randomBytes(16).toString('hex')}.${safeExt}`;
}

export type SealedFile = {
  iv: string;
  authTag: string;
  sha256: string;
  sizeBytes: number;
};

export async function sealFile(userId: number, storedName: string, data: Buffer): Promise<SealedFile> {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key(), iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const target = join(vaultRoot(), String(userId), storedName);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, encrypted, { mode: 0o600 });

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    sha256: createHash('sha256').update(data).digest('hex'),
    sizeBytes: data.length,
  };
}

export async function openFile(
  userId: number,
  storedName: string,
  ivB64: string,
  authTagB64: string,
): Promise<Buffer> {
  const target = join(vaultRoot(), String(userId), storedName);
  const encrypted = await readFile(target);

  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function purgeFile(userId: number, storedName: string): Promise<void> {
  const target = join(vaultRoot(), String(userId), storedName);
  await unlink(target).catch(() => {});
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const SENSITIVE_KINDS = new Set(['ktp', 'ijazah', 'transkrip']);

export const FILE_KINDS: Record<string, { label: string; sensitive: boolean }> = {
  cv: { label: 'CV', sensitive: false },
  ijazah: { label: 'Ijazah terakhir', sensitive: true },
  transkrip: { label: 'Transkrip nilai', sensitive: true },
  ktp: { label: 'KTP', sensitive: true },
  sertifikat: { label: 'Sertifikat', sensitive: false },
  foto: { label: 'Foto formal', sensitive: false },
};

export function isAllowedUpload(type: string, size: number): { ok: true } | { ok: false; reason: string } {
  if (!(type in ALLOWED_MIME)) {
    return { ok: false, reason: 'Format harus PDF, JPG, atau PNG.' };
  }
  if (size > MAX_FILE_BYTES) {
    return { ok: false, reason: 'Ukuran berkas maksimal 5 MB.' };
  }
  if (size === 0) {
    return { ok: false, reason: 'Berkas kosong.' };
  }
  return { ok: true };
}

export function extensionFor(type: string): string {
  return ALLOWED_MIME[type] ?? 'bin';
}
