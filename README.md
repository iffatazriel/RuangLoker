# RuangLoker

Satu ruang, semua lamaran. Profil dan berkas diisi sekali, lalu lamaran ke banyak lowongan
terkurasi disiapkan otomatis — dan tetap dikirim dari email / WhatsApp milik pelamar sendiri.

Dokumen produk lengkap ada di [`blueprint-platform-lamaran-kerja-1-klik.md`](./blueprint-platform-lamaran-kerja-1-klik.md),
dan mockup visual di [`Wireframe Platform Lamaran Kerja 1-Klik.html`](./Wireframe%20Platform%20Lamaran%20Kerja%201-Klik.html).

## Status

### Slice 1 — Lowongan publik + kurasi ✅

- Daftar lowongan dengan pencarian, filter kota / kategori / tipe, dan **filter radius GPS** (Haversine di SQLite).
- Detail lowongan: label kepercayaan, sumber asli, tanggal pengecekan, batas lamar, dan penjelasan jujur cara melamar.
- Panel kurasi internal (`/kelola`) dengan antrean harian: perlu dicek, berakhir 7 hari, sudah kedaluwarsa.
- Aksi kurasi tercatat di `curation_log` (verify / manual check / reject / deactivate / extend).
- Penanganan 404 asli, sembunyi otomatis untuk lowongan kedaluwarsa dan yang belum lolos kurasi.

### Slice 2 — Akun, consent UU PDP, profil, brankas berkas ✅

- **Daftar / masuk / keluar** dengan hash kata sandi scrypt dan sesi server-side (cookie hanya membawa id).
- **Consent bertingkat**: wajib (akun), terpisah (data sensitif), dan opsional (pemasaran) — masing-masing dicatat dengan versi kebijakan.
- **Pencabutan consent data sensitif benar-benar menghapus** berkas KTP/ijazah/transkrip, bukan hanya menandai.
- **Profil sekali isi** dengan indikator kelengkapan yang menjelaskan apa yang masih kurang.
- **Brankas berkas** terenkripsi AES-256-GCM; unggahan baru satu jenis menggantikan yang lama (tidak menumpuk).
- **Hapus akun** memusnahkan berkas fisik, menganonimkan email, dan mematikan sesi seketika.

### Slice 3 — CV Builder ATS + Skor CV rule-based ✅

- **CV ATS dari profil** (`/cv`): satu kolom, judul bagian standar. Ada penanda saat profil berubah setelah CV dibuat, plus tombol perbarui.
- **Skor CV 100 poin** (`src/lib/cv-score.ts`, aturan `v1`): fungsi murni, deterministik, tanpa AI. Setiap pengurangan punya alasan yang bisa dibaca pengguna. Riwayat skor disimpan di `cv_scores`.
- **PDF dengan text layer asli** via `@react-pdf/renderer` (font standar Helvetica, tanpa browser). Disimpan ke brankas sebagai `kind='cv'` dengan nama `CV_Nama-Lengkap_Posisi.pdf`, menggantikan CV lama.

Slice 4–5: Siapkan lamaran (surat otomatis per kanal, salin/buka Gmail/WhatsApp/form, tautan CV publik bertoken), antrean "Lamar semua" sampai 5 lowongan, riwayat lamaran, kuota Gratis 3/bulan.

Slice 6: halaman Harga (`/paket`), Kredit Lamaran (Rp10.000 = 10 lamaran, dipakai setelah kuota Gratis habis), Pesanan Jasa, pembayaran transfer/QRIS manual yang dikonfirmasi admin di `/kelola/pesanan`. Panel kurasi dan admin hanya untuk email di `ADMIN_EMAILS`; info rekening/QRIS lewat `PAYMENT_*` di `.env`.

Siap rilis: admin menambah/mengubah lowongan di `/kelola/lowongan/baru`, lupa kata sandi lewat email (Resend, token sekali pakai 60 menit, semua sesi lama dikeluarkan), batas percobaan masuk/daftar/reset/laporan, formulir `/laporkan` aktif, email notifikasi pesanan ke admin dan pembeli, halaman `/privasi` dan `/syarat`, skrip `db:backup`.

Belum dibangun: payment gateway otomatis, paket Pro/Gmail OAuth, CV kreatif, dashboard perusahaan.

## Stack

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Astro 7 (`output: server`, adapter Node) | Halaman lowongan harus terindeks Google — kanal akuisisi nyata |
| Styling | Tailwind 4 (`@theme`) | Token monokrom dari wireframe, tanpa build tambahan |
| Database | SQLite via libSQL | Nol setup, ramah Windows; migrasi ke Postgres saat pilot lulus |
| ORM | Drizzle | Query type-safe, skema sebagai satu-satunya sumber kebenaran |
| PDF CV | `@react-pdf/renderer` | Text layer asli tanpa memasang Chrome; PDF hasil screenshot tidak terbaca ATS |

## Menjalankan

```bash
npm install --include=dev      # penting: npm di mesin ini punya omit=dev
cp .env.example .env
# isi VAULT_SECRET — tanpa ini unggah berkas akan gagal
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:4321`. Panel kurasi: `/kelola`. Aplikasi pelamar: `/app`.

> **Windows:** kalau `npm install` melewatkan devDependencies, paket `drizzle-kit` dan `dotenv`
> tidak akan ada. Selalu pakai `--include=dev`.
>
> **Penting:** `VAULT_SECRET` mengunci enkripsi brankas. Kalau nilainya hilang atau berubah, berkas
> lama tidak bisa dibuka lagi. Simpan di secret manager saat produksi, jangan di git.

## Produksi

```bash
npm ci --include=dev && npm run build
npm run db:migrate
HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs
```

Variabel wajib di `.env` produksi:

| Variabel | Isi |
| --- | --- |
| `DATABASE_URL` | `file:/var/lib/ruangloker/ruangloker.db` atau URL libSQL/Turso |
| `VAULT_SECRET`, `VAULT_DIR` | Kunci brankas (jangan pernah diganti) dan folder berkas di luar folder publik |
| `ADMIN_EMAILS` | Email akun yang boleh membuka `/kelola` dan konfirmasi pembayaran |
| `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_NUMBER`, `PAYMENT_ACCOUNT_NAME`, `PAYMENT_QRIS_URL` | Info transfer/QRIS yang tampil di `/pesanan`. Selama kosong, pengguna diminta tidak transfer dulu |
| `APP_URL` | URL publik (mis. `https://ruangloker.id`) untuk tautan di email |
| `RESEND_API_KEY`, `MAIL_FROM` | Email lupa kata sandi, status pesanan, dan notifikasi admin lewat [Resend](https://resend.com). Domain `MAIL_FROM` harus diverifikasi di Resend. Selama kosong, email hanya dicetak ke log server |
| `CONTACT_EMAIL` | Kontak yang tampil di `/privasi` dan `/syarat` |
| `TRUST_PROXY=1` | Wajib kalau di belakang Caddy/Nginx, supaya batas percobaan masuk memakai IP asli |

Nilai yang mengandung spasi harus diberi tanda kutip, mis. `MAIL_FROM="RuangLoker <noreply@ruangloker.id>"`.

Lowongan sungguhan dimasukkan admin lewat `/kelola/lowongan/baru` (bisa diubah dari panel kurasi). Laporan pengguna dari `/laporkan` muncul di `/kelola` dan dikirim ke `ADMIN_EMAILS`.

### Backup

`npm run db:backup` membuat salinan konsisten database (`VACUUM INTO`) dan folder brankas di `BACKUP_DIR/YYYYMMDD-HHMM`, menyimpan `BACKUP_KEEP` terakhir. Contoh cron harian jam 02.00 WIB, lalu salin ke luar server (mis. `rclone` ke Google Drive/S3):

```cron
0 2 * * * cd /srv/ruangloker && npm run db:backup && rclone sync backups remote:ruangloker-backup
```

Backup yang hanya ada di server yang sama tidak menolong kalau server hilang.

Cadangkan database **dan** `VAULT_DIR` bersama-sama; salah satu tanpa yang lain tidak bisa dipulihkan.
Jalankan di belakang HTTPS (Caddy/Nginx). Jangan jalankan `db:seed` di produksi.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi (SSR) |
| `npm run check` | Typecheck Astro + TypeScript |
| `npm test` | Unit test (`node:test`): Skor CV, surat lamaran, harga, form lowongan, batas percobaan, email |
| `npm run db:generate` | Buat migrasi dari `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi |
| `npm run db:seed` | Isi/perbarui 15 lowongan contoh (upsert per slug, ID tetap) |
| `npm run db:reset` | Hapus database lokal |
| `npm run db:backup` | Cadangkan database + brankas |

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
6. **Consent diperiksa di server, bukan hanya disembunyikan di tampilan.** Unggah KTP tanpa izin
   ditolak walaupun tombolnya diakali.
7. **Mencabut izin data sensitif menghapus berkas fisiknya.** Consent yang dicabut tetapi datanya
   tetap disimpan adalah pelanggaran, bukan fitur.
8. **Berkas tidak pernah punya URL publik**, kecuali tautan CV untuk HRD (`/c/[token]`): hanya CV aktif,
   token acak 30 hari, bisa dicabut. Unduhan lain melewati pemeriksaan sesi pemilik; user lain
   mendapat 404, bukan 403 yang membocorkan keberadaan berkas.
9. **Kegagalan login tidak membedakan** email tidak terdaftar vs kata sandi salah.
10. **Lamaran tidak pernah terkirim otomatis.** RuangLoker hanya membuka Gmail, WhatsApp, atau formulir
    dengan isi terisi; pelamar sendiri yang menekan kirim lalu menandai terkirim.
11. **Kredit hanya bertambah lewat konfirmasi admin**, sekali per pesanan (indeks unik di `credit_ledger`).

## Keputusan yang masih terbuka

- Definisi terukur "lowongan valid" (KPI 90% di blueprint butuh definisi ini).
- Kebijakan refund kredit saat lowongan kedaluwarsa setelah dipilih (sekarang: kuota/kredit tidak kembali saat lamaran dibatalkan).
- Payment gateway (Midtrans/Xendit) menggantikan konfirmasi manual.
- Alur consent UU PDP untuk KTP (wajib, harus terpisah dari consent pemasaran).
