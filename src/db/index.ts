import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = import.meta.env?.DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./data/ruangloker.db';

const client = createClient({
  url,
  authToken: import.meta.env?.DATABASE_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
