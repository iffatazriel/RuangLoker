import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.DATABASE_URL ?? 'file:./data/ruangloker.db';
const client = createClient({ url });

await migrate(drizzle(client), { migrationsFolder: './drizzle' });
client.close();

console.log(`Migrasi selesai → ${url}`);
