import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

try {
  process.loadEnvFile();
} catch {
  // .env opsional.
}

const url = process.env.DATABASE_URL ?? 'file:./data/ruangloker.db';
if (url.startsWith('file:')) {
  await mkdir(dirname(url.slice('file:'.length)), { recursive: true });
}

const client = createClient({ url });

await migrate(drizzle(client), { migrationsFolder: './drizzle' });
client.close();

console.log(`Migrasi selesai → ${url}`);
