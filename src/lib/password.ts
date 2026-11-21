import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const KEY_LEN = 64;
const PARAMS: ScryptOptions & { N: number; r: number; p: number } = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LEN, options, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, PARAMS);

  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
  const salt = Buffer.from(saltRaw, 'base64');
  const expected = Buffer.from(hashRaw, 'base64');

  if (expected.length !== KEY_LEN) return false;

  const derived = await scrypt(password.normalize('NFKC'), salt, {
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
    maxmem: 64 * 1024 * 1024,
  });

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim()) && value.length <= 254;
}

export function checkPasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (password.length > 200) return 'Kata sandi terlalu panjang.';
  if (!/[a-zA-Z]/.test(password)) return 'Sertakan minimal satu huruf.';
  if (!/[0-9]/.test(password)) return 'Sertakan minimal satu angka.';
  return null;
}
