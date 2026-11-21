// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

try {
  process.loadEnvFile();
} catch {
  // .env opsional saat build.
}

const site = 'https://ruangloker.id';
// Domain publik yang Host/X-Forwarded-Host-nya dipercaya (wajib di belakang Caddy/Nginx
// supaya Astro.url dan cek Origin form memakai domain asli, bukan localhost).
const publicHosts = [...new Set([site, process.env.APP_URL].filter(Boolean).map((u) => new URL(String(u)).hostname))];

export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    allowedDomains: publicHosts.flatMap((hostname) => [{ hostname }, { hostname: `www.${hostname}` }]),
  },
  session: {
    // Disimpan di folder data (ikut volume/backup), bukan node_modules, agar login tidak hilang setiap deploy.
    driver: sessionDrivers.fsLite({ base: './data/sessions' }),
    cookie: { name: 'rl_session', sameSite: 'lax' },
    ttl: 60 * 60 * 24 * 30,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
  },
});
