// Variabel server selalu dibaca dari process.env saat runtime, tidak pernah ditanam ke hasil build.
// .env lokal dimuat sekali; variabel yang sudah ada di environment server tetap diutamakan.
try {
  process.loadEnvFile();
} catch {
  // .env opsional (mis. di Docker variabel datang dari environment).
}

export function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}
