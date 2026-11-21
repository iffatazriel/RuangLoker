import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { env } from '../lib/env';

const url = env('DATABASE_URL') || 'file:./data/ruangloker.db';

const client = createClient({
  url,
  authToken: env('DATABASE_AUTH_TOKEN') || undefined,
});

export const db = drizzle(client, { schema });
export { schema };
