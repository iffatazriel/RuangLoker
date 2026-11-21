// Variabel server dibaca saat runtime; process.env sebagai cadangan untuk node:test dan skrip.
export function env(name: string): string {
  const fromVite = (import.meta as { env?: Record<string, unknown> }).env?.[name];
  const value = fromVite ?? process.env[name] ?? '';
  return String(value).trim();
}
