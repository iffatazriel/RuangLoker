# RuangLoker

Satu ruang, semua lamaran. Profil dan berkas diisi sekali, lalu lamaran ke banyak lowongan
terkurasi disiapkan otomatis — dan tetap dikirim dari email / WhatsApp milik pelamar sendiri.

Dokumen produk lengkap ada di [`blueprint-platform-lamaran-kerja-1-klik.md`](./blueprint-platform-lamaran-kerja-1-klik.md),
dan mockup visual di [`Wireframe Platform Lamaran Kerja 1-Klik.html`](./Wireframe%20Platform%20Lamaran%20Kerja%201-Klik.html).

## Status: slice 1 — Lowongan publik + kurasi

Yang sudah jadi:

- Daftar lowongan dengan pencarian, filter kota / kategori / tipe, dan **filter radius GPS** (Haversine di SQLite).
- Detail lowongan: label kepercayaan, sumber asli, tanggal pengecekan, batas lamar, dan penjelasan jujur cara melamar.
- Panel kurasi internal (`/kelola`) dengan antrean harian: perlu dicek, berakhir 7 hari, sudah kedaluwarsa.
- Aksi kurasi tercatat di `curation_log` (verify / manual check / reject / deactivate / extend).
- Penanganan 404 asli, sembunyi otomatis untuk lowongan kedaluwarsa dan yang belum lolos kurasi.

Belum dibangun: auth, consent UU PDP, profil, brankas berkas, CV builder, antrean kirim, pembayaran.

## Stack

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Astro 7 (`output: server`, adapter Node) | Halaman lowongan harus terindeks Google — kanal akuisisi nyata |
| Styling | Tailwind 4 (`@theme`) | Token monokrom dari wireframe, tanpa build tambahan |
| Database | SQLite via libSQL | Nol setup, ramah Windows; migrasi ke Postgres saat pilot lulus |
| ORM | Drizzle | Query type-safe, skema sebagai satu-satunya sumber kebenaran |
| PDF CV (rencana) | Headless Chrome | Wajib punya text layer — PDF hasil screenshot tidak terbaca ATS |

## Menjalankan

```bash
npm install --include=dev      # penting: npm di mesin ini punya omit=dev
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:4321`.
Panel kurasi: `http://localhost:4321/kelola`.

> Catatan Windows: kalau `npm install` melewatkan devDependencies, paket `drizzle-kit` dan
> `dotenv` tidak akan ada. Selalu pakai `--include=dev`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi (SSR) |
| `npm run check` | Typecheck Astro + TypeScript |
| `npm run db:generate` | Buat migrasi dari `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi |
| `npm run db:seed` | Isi 15 lowongan contoh |
| `npm run db:reset` | Hapus database lokal |

## Aturan produk yang sudah dikunci di kode

1. **Lowongan yang belum lolos kurasi tidak tampil publik.** Hanya `verified` dan `manual_checked`
   yang muncul, dan hanya selama belum kedaluwarsa.
2. **Setiap kartu menyebut sumber asli dan tanggal pengecekan.** Bukan hiasan — ini pembeda dari
   agregator tautan.
3. **Tidak ada klaim lampiran otomatis** untuk email maupun WhatsApp. Lampiran selalu diunggah
   manual oleh pelamar; halaman detail mengatakannya terbuka.
4. **Persentase kecocokan tidak ditampilkan sebelum ada definisi skornya.** Halaman detail
   menyebut hal ini secara eksplisit alih-alih menampilkan angka yang tidak bisa dipertanggungjawabkan.
5. **Panel kurasi tidak diindeks** (`robots.txt` + `noindex`).

## Keputusan yang masih terbuka

- Definisi terukur "lowongan valid" (KPI 90% di blueprint butuh definisi ini).
- Aturan Skor CV rule-based — belum ada satu pun aturan yang ditulis.
- Kebijakan refund kredit saat lowongan kedaluwarsa setelah dipilih.
- Alur consent UU PDP untuk KTP (wajib, harus terpisah dari consent pemasaran).
