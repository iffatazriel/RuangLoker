import { rm } from 'node:fs/promises';

await rm('./data/ruangloker.db', { force: true });
await rm('./data/ruangloker.db-journal', { force: true });
console.log('Database dihapus. Jalankan: npm run db:generate && npm run db:migrate && npm run db:seed');
