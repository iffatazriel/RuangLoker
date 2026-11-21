import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

// Pengambil halaman untuk impor lowongan dan cek tautan: hanya http(s) ke alamat publik,
// dengan batas waktu dan ukuran, supaya server tidak bisa diarahkan ke jaringan internal.

const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3],
] as const) blocked.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]] as const)
  blocked.addSubnet(net, prefix, 'ipv6');

export function isPublicAddress(address: string): boolean {
  const v = isIP(address);
  if (v === 0) return false;
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return !blocked.check(mapped[1], 'ipv4');
  return !blocked.check(address, v === 4 ? 'ipv4' : 'ipv6');
}

export type FetchedPage = { status: number; url: string; html: string };

export class FetchError extends Error {}

const USER_AGENT = 'RuangLokerBot/1.0 (+https://ruangloker.id; kurasi lowongan)';

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchError('Tautan tidak valid.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new FetchError('Tautan harus diawali http(s)://.');
  if (url.username || url.password) throw new FetchError('Tautan tidak boleh berisi nama pengguna atau sandi.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new FetchError('Domain tidak ditemukan.');
  if (!addresses.every((a) => isPublicAddress(a.address))) throw new FetchError('Alamat itu tidak boleh diakses.');
  return url;
}

export async function safeFetchPage(
  raw: string,
  { timeoutMs = 10_000, maxBytes = 2_000_000, maxRedirects = 4 } = {},
): Promise<FetchedPage> {
  let url = await assertPublicUrl(raw);
  const signal = AbortSignal.timeout(timeoutMs);
  for (let hop = 0; ; hop++) {
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'id,en;q=0.8' },
      });
    } catch (err) {
      throw new FetchError((err as Error).name === 'TimeoutError' ? 'Halaman terlalu lama merespons.' : 'Halaman tidak bisa dibuka.');
    }
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      if (hop >= maxRedirects) throw new FetchError('Terlalu banyak pengalihan.');
      await res.body?.cancel();
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = res.body?.getReader();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { status: res.status, url: url.toString(), html };
  }
}
