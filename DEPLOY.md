# Deploy RuangLoker ke VPS

Panduan ini untuk satu VPS Linux (Ubuntu 22.04/24.04, minimal 1 vCPU / 1 GB RAM) dengan Docker.
Caddy mengurus HTTPS otomatis. Semua data (database SQLite, brankas terenkripsi, sesi login) ada di folder `data/`.

## 1. Siapkan domain dan server

1. Beli/arahkan domain. Buat DNS record `A` untuk `ruangloker.id` dan `www` ke IP VPS.
2. Di VPS, pasang Docker: `curl -fsSL https://get.docker.com | sh`
3. Buka port 80 dan 443 di firewall (`ufw allow 80,443/tcp`).

## 2. Ambil kode dan isi `.env`

```bash
git clone https://github.com/iffatazriel/RuangLoker /srv/ruangloker
cd /srv/ruangloker
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # atau: openssl rand -base64 32
```

Isi `.env` minimal:

| Variabel | Contoh | Catatan |
|---|---|---|
| `DOMAIN` | `ruangloker.id` | Dipakai Caddy untuk sertifikat HTTPS |
| `APP_URL` | `https://ruangloker.id` | Tautan di email; juga domain yang dipercaya untuk login/form |
| `VAULT_SECRET` | hasil perintah di atas | **Simpan juga di password manager.** Hilang = berkas brankas tidak bisa dibuka |
| `ADMIN_EMAILS` | `kamu@gmail.com` | Akun yang boleh membuka `/kelola` |
| `PAYMENT_*` | rekening / `/qris.png` | Kosong = pengguna diminta tidak transfer dulu |
| `RESEND_API_KEY`, `MAIL_FROM` | `re_...`, `"RuangLoker <noreply@ruangloker.id>"` | Lihat langkah 4 |
| `CONTACT_EMAIL` | `halo@ruangloker.id` | Tampil di halaman Privasi |

`DATABASE_URL`, `VAULT_DIR`, dan `TRUST_PROXY` sudah diatur oleh `docker-compose.yml`.
Nilai yang mengandung spasi wajib diberi tanda kutip.

Gambar QRIS: taruh di `public/qris.png` sebelum build, lalu isi `PAYMENT_QRIS_URL=/qris.png`.

## 3. Jalankan

```bash
docker compose up -d --build
docker compose logs -f app     # tunggu "[cek-env] konfigurasi produksi OK."
curl https://ruangloker.id/api/health   # {"ok":true,...}
```

Saat start, container menjalankan migrasi database lalu `scripts/check-env.mjs`.
Kalau ada konfigurasi wajib yang salah, container berhenti dan alasannya tertulis di log.

Lalu daftar akun lewat `/daftar` memakai email yang ada di `ADMIN_EMAILS`, dan masukkan lowongan sungguhan di `/kelola/lowongan/baru`.
**Jangan jalankan `db:seed` di produksi.**

## 4. Email (Resend)

1. Daftar di https://resend.com → **Domains** → tambah `ruangloker.id`.
2. Tambahkan record DNS (SPF/DKIM) yang diberikan Resend, tunggu status **Verified**.
3. Buat API key (izin *Sending access*), isi `RESEND_API_KEY`, lalu `docker compose up -d`.
4. Uji: buka `/lupa-sandi` dengan email akunmu; email harus masuk dalam 1 menit.
   Kalau gagal, cek `docker compose logs app | grep mail`.

## 5. Backup harian ke luar server

Backup di server yang sama tidak cukup. Contoh cron (`crontab -e`), memakai [rclone](https://rclone.org) ke Google Drive/S3:

```cron
0 2 * * * cd /srv/ruangloker && docker compose exec -T app node scripts/backup.mjs && rclone sync backups remote:ruangloker-backup
# Cek tautan sumber lowongan tiap hari jam 06.00 WIB
0 6 * * * cd /srv/ruangloker && docker compose exec -T app npm run jobs:check-links
```

Restore: hentikan app (`docker compose stop app`), salin `ruangloker.db` dan folder `vault/` dari satu folder backup
ke `data/`, lalu `docker compose start app`. `VAULT_SECRET` harus sama dengan saat backup dibuat.

## 6. Update versi

```bash
cd /srv/ruangloker && git pull && docker compose up -d --build
```

Data, sesi login, dan sertifikat tetap tersimpan di `data/` dan volume Caddy.

## Tanpa Docker (opsional)

Pasang Node 22 dan Caddy, lalu:

```bash
npm ci --include=dev && npm run build && npm run db:migrate
sudo cp deploy/ruangloker.service /etc/systemd/system/ && sudo systemctl enable --now ruangloker
sudo cp deploy/Caddyfile.systemd /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

Isi `TRUST_PROXY=1` di `.env`. `npm start` menjalankan cek konfigurasi sebelum server hidup.
Setiap kali `.env` berubah cukup restart service; tidak perlu build ulang.

## Checklist sebelum dibuka ke publik

- [ ] `https://domain/api/health` → `ok: true`
- [ ] Daftar, masuk, keluar, lupa sandi (email benar-benar masuk)
- [ ] Akun admin bisa membuka `/kelola`; akun biasa mendapat 404
- [ ] Minimal 20–30 lowongan sungguhan berstatus terverifikasi
- [ ] Info rekening/QRIS tampil di `/pesanan`
- [ ] Backup pertama berhasil dan sudah tersalin ke luar server
- [ ] Teks `/privasi` dan `/syarat` sudah dibaca dan disetujui
