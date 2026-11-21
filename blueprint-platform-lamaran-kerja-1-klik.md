# Blueprint Platform Lamaran Kerja 1-Klik

Satu profil, satu kali upload berkas, lalu melamar ke banyak lowongan yang valid dan sesuai lokasi — lengkap dengan pembuat CV ATS dan CV kreatif, penilaian CV, dan generator surat lamaran.

> **Keputusan kunci yang sudah disepakati:** lamaran tetap dikirim dari email / WhatsApp milik pelamar sendiri, tetapi subjek, isi surat, nama file, dan lampirannya disiapkan otomatis oleh platform. Pelamar percaya karena pengirimnya adalah dirinya, perusahaan percaya karena formatnya rapi, dan platform terhindar dari masalah spam.

**Untuk siapa di awal?** Fresh graduate dan pencari kerja operasional — admin, retail, gudang, kasir, driver, dan customer service — di satu wilayah pilot terlebih dahulu.

**Janji produk dalam satu kalimat:** Profil dan berkas diisi sekali; setiap lamaran berikutnya tinggal ditinjau sebentar lalu dikirim — sudah rapi, sudah sesuai format perusahaan, dan CV-nya sudah dinilai sebelum berangkat.

**Definisi "1-klik" yang boleh dipakai:** satu klik berarti satu aksi yang menghasilkan lamaran siap kirim tanpa mengetik ulang apa pun. Bukan berarti nol sentuhan — pelamar tetap menekan Send di email atau WhatsApp miliknya sendiri, sesuai keputusan kunci di atas.

### Batas janji: yang boleh dan tidak boleh diucapkan

Seluruh positioning ini berdiri di atas "kepercayaan". Satu klaim berlebihan di percobaan pertama merusak kredibilitas yang dibangun oleh kurasi lowongan.

| Klaim | Boleh dipakai? | Alasan |
| --- | --- | --- |
| "Profil sekali isi, tidak pernah mengetik data yang sama lagi" | Ya | Benar secara teknis dan bisa dibuktikan di sesi pertama. |
| "Lamaran rapi dan konsisten di setiap perusahaan" | Ya | Inti nilai: nama file, surat, dan format disiapkan otomatis. |
| "Lamar 5 lowongan dalam 5 menit" | Ya, setelah diukur | Bergantung pada langkah lampiran manual; pakai angka hasil uji, bukan perkiraan. |
| "1 klik langsung terkirim" | Tidak | Gmail dan WhatsApp tidak mengizinkan lampiran otomatis lewat tautan; pelamar tetap menekan Send. |
| "20–30 detik per lamaran" | Tidak | Tidak mungkin selama lampiran diunggah manual. Ganti dengan hitungan jujur di bab 3. |

Dokumen ini adalah blueprint pembangunan: konsep, alur, struktur halaman, model data, pricing, roadmap 90 hari, serta risiko dan keamanan data. Angka harga di dalamnya adalah rekomendasi awal untuk diuji, bukan harga final yang terkunci.

---

## 1. Masalahnya bukan lowongan, tapi prosesnya

Pencari kerja di Indonesia umumnya tidak kekurangan daftar lowongan. Yang membuat mereka lelah adalah proses yang berulang di setiap lamaran: mengunggah CV yang sama, mengetik ulang nama dan alamat, menulis surat lamaran dari nol, lalu tidak pernah tahu mengapa CV-nya tidak lolos seleksi awal.

### Upload berulang

CV, ijazah, transkrip, KTP, dan foto diminta lagi di setiap portal, padahal isinya selalu sama.

### Form yang berbeda-beda

Setiap perusahaan memakai formulir dan sistem rekrutmen (ATS — Applicant Tracking System) yang berbeda, sehingga data harus diisi ulang terus-menerus.

### CV tanpa umpan balik

Pelamar tidak tahu apakah CV-nya terbaca mesin ATS, kekurangan kata kunci, atau memang belum memenuhi kualifikasi.

### Lowongan tidak terpercaya

Lowongan dari sumber publik bercampur antara yang masih aktif, yang sudah kadaluarsa, duplikat, dan penipuan berkedok rekrutmen.

### Peluang

Platform yang menyelesaikan keempat masalah itu sekaligus — profil sekali isi, berkas sekali upload, lowongan terkurasi berdasarkan lokasi, dan CV yang dinilai — memiliki alasan kuat untuk dipakai berulang, bukan hanya dikunjungi sekali. Nilai utamanya adalah waktu yang dihemat dan kepastian bahwa lamaran terkirim dalam format yang benar.

> **Prinsip produk:** jangan mulai dari 10.000 lowongan yang tidak terverifikasi. Mulai dari 50–100 lowongan yang benar-benar valid di satu kota dan satu-dua kategori pekerjaan. Kepercayaan adalah fitur pertama.

---

## 2. Solusi: enam fitur inti dalam satu alur

### A. Profil sekali isi

Pelamar mengisi data diri, pendidikan, pengalaman, keahlian, sertifikasi, gaji yang diharapkan, dan preferensi pekerjaan satu kali. Data ini menjadi sumber untuk semua lamaran, CV, dan surat lamaran berikutnya — tidak ada pengetikan ulang.

### B. Brankas berkas (penyimpanan terbatas)

CV, ijazah, transkrip, KTP, sertifikat, dan pas foto disimpan sekali dan dapat dipakai ulang untuk semua lamaran. Batas penyimpanan dibedakan per paket (lihat bab Pricing) dan nama file otomatis dirapikan, misalnya `CV_Nama_Posisi.pdf`.

### C. Lowongan berdasarkan lokasi

Pelamar dapat memakai lokasi GPS untuk melihat lowongan dalam radius tertentu, atau memfilter manual berdasarkan provinsi, kota, radius jarak, kategori, tipe kerja (penuh waktu, paruh waktu, magang, kontrak), rentang gaji, dan tingkat pengalaman.

### D. Pembuat CV ATS dan CV kreatif

Dari data profil yang sama, sistem menghasilkan dua versi: CV ATS yang bersih, satu kolom, dan mudah dibaca mesin; serta CV kreatif dengan template visual untuk bidang yang menghargai portofolio dan tampilan.

### E. Penilaian CV

Setiap CV menerima skor dan daftar perbaikan yang konkret: bagian yang kosong, kata kunci yang hilang dibandingkan lowongan yang dituju, pengalaman yang belum terukur dengan angka, dan kesalahan format yang membuat CV gagal dibaca ATS.

### F. Generator surat lamaran

Surat lamaran dibuat dari template dan terisi otomatis dari profil, nama perusahaan, dan posisi yang dilamar. Pelamar tinggal meninjau dan menyesuaikan satu-dua kalimat sebelum mengirim.

---

## 3. Cara kerja lamar 1-klik: pengirim tetap pelamar

Ada tiga cara mengirim lamaran, dan blueprint ini memilih cara pertama untuk tahap awal, dengan cara ketiga sebagai tujuan jangka panjang.

| Cara | Cara kerja & keputusan |
| --- | --- |
| 1. Dari akun pelamar, format dari platform | Dipakai untuk MVP. Platform menyiapkan subjek email, isi surat, nama file, dan lampiran. Pelamar menekan tombol kirim di Gmail / WhatsApp miliknya sendiri. Balasan perusahaan masuk langsung ke pelamar. |
| 2. Dari email platform | Ditunda. Risiko masuk spam, perusahaan kurang percaya, dan balasan nyasar ke platform, bukan ke pelamar. |
| 3. Apply internal di platform | Tujuan jangka panjang, hanya untuk perusahaan yang memasang lowongan langsung di platform dan memantau lamaran dari dashboard perusahaan. |

### Alur antrian kirim — dan berapa detik sebenarnya

1. **Lengkapi profil & brankas.** Isi profil sekali, upload berkas sekali, buat atau nilai CV. *(sekali seumur akun)*
2. **Pilih lowongan.** Filter lokasi / GPS dan kualifikasi, centang misalnya 5 lowongan yang cocok. *(±30–60 detik)*
3. **Tekan "Lamar Semua".** Sistem memeriksa kecocokan kualifikasi, menyiapkan surat dan berkas yang berbeda untuk tiap perusahaan. *(otomatis)*
4. **Kirim berurutan.** Antrian 1 sampai 5 muncul satu per satu: Gmail terbuka dengan subjek, isi surat, dan penerima sudah terisi; pelamar melampirkan CV dari brankas lalu menekan Send. Untuk WhatsApp, chat perusahaan terbuka dengan pesan sudah terisi. *(±20–40 detik per lamaran)*
5. **Tercatat otomatis.** Setiap lamaran masuk ke halaman Riwayat dengan status terkirim, tanggal, dan perusahaan tujuannya.

**Hitungan yang jujur:** 5 lamaran ≈ 3–5 menit total, dibandingkan ±50 menit jika dikerjakan manual (10 menit × 5). Itu klaim yang bisa dipertahankan dan diverifikasi. Angka final wajib diganti dengan hasil pengukuran uji pengguna — lihat KPI di bab 7.

> **Batas teknis yang harus diterima di MVP:** tautan `mail.google.com/?view=cm` dan `wa.me` **tidak** dapat melampirkan file, dan isi pesan Gmail terpotong di sekitar 2.000 karakter. Artinya lampiran CV selalu diunggah manual oleh pelamar di kedua kanal. Karena itu platform harus membuat langkah ini sesingkat mungkin: tombol "Unduh CV siap lampir" di layar antrean, nama file yang sudah rapi, dan pengingat berkas mana yang dibutuhkan lowongan tersebut.

**Evolusi Pro:** pengguna Pro dapat menghubungkan akun Gmail melalui OAuth sehingga platform benar-benar mengirim email beserta lampiran atas namanya, dengan izin eksplisit yang dapat dicabut. Ini satu-satunya cara memenuhi janji "1 klik" secara harfiah — dan karena itu harus menjadi **fitur utama Pro**, bukan opsi tambahan di baris tabel.

---

## 4. Lowongan dari publik harus melewati kurasi

Mengambil lowongan dari berbagai sumber publik diperbolehkan sebagai strategi awal, tetapi tidak boleh tampil mentah di website. Setiap lowongan wajib melewati lima saringan sebelum terbit.

1. **Sumber jelas:** catat sumber asli, nama perusahaan, kontak resmi, dan tanggal lowongan ditemukan.
2. **Deduplikasi:** lowongan yang sama dari beberapa sumber digabung menjadi satu entri.
3. **Cek kadaluarsa:** lowongan melewati batas waktu atau tanpa aktivitas dalam jangka tertentu otomatis diturunkan dan diverifikasi ulang.
4. **Saringan penipuan:** tolak lowongan yang meminta biaya pendaftaran, transfer uang, atau data sensitif yang tidak wajar. Tampilkan peringatan ini ke pelamar.
5. **Saluran lamar terpetakan:** setiap lowongan diberi label saluran — Email, WhatsApp, Google Form, atau Portal Eksternal — karena hanya tiga saluran pertama yang didukung alur antrian kirim di MVP.

### Label kepercayaan di setiap kartu lowongan

- Terverifikasi
- Dicek manual
- Berakhir segera
- Dari perusahaan langsung

Label ini bukan hiasan. Label adalah janji bahwa seseorang atau sistem sudah memeriksa lowongan tersebut, dan menjadi pembeda utama dari papan lowongan yang hanya menumpuk tautan.

### Struktur website (sitemap MVP)

| Halaman | Fungsi |
| --- | --- |
| Beranda / Cari Lowongan | Pencarian, filter kota & radius GPS, kategori, gaji, tipe kerja; kartu lowongan dengan label kepercayaan. |
| Detail Lowongan | Kualifikasi, kecocokan dengan profil (persentase), berkas yang dibutuhkan, tombol Lamar dan Simpan. |
| Profil Saya | Data diri, pendidikan, pengalaman, keahlian, preferensi kerja dan lokasi. |
| Brankas Berkas | Upload, ganti nama otomatis, kuota penyimpanan, masa berlaku berkas. |
| Studio CV | Buat CV ATS & kreatif, lihat Skor CV, daftar perbaikan, unduh PDF. |
| Surat Lamaran | Pilih template, surat terisi otomatis per lowongan, edit dan simpan. |
| Keranjang Lamaran & Riwayat | Antrian kirim multi-lowongan dan catatan semua lamaran terkirim. |
| Paket & Pembayaran | Gratis, Pro, kredit lamaran, dan paket perusahaan. |
| Dashboard Perusahaan (Fase 2) | Pasang lowongan, terima lamaran internal, saring kandidat berdasarkan skor kecocokan. |

---

## 5. Pricing: uang masuk dari jasa dulu, langganan belakangan

Urutan pendapatan di versi sebelumnya salah tempat. Pencari kerja yang sedang menganggur hampir tidak mungkin membeli langganan sebelum mereka merasakan hasil, sementara UMKM Indonesia hampir tidak punya kebiasaan membayar untuk memasang lowongan. Karena itu urutan prioritas pendapatan selama 90 hari pertama dibalik:

1. **Jasa sekali bayar** — Review CV dan Buat CV ATS. Uang masuk minggu pertama, tanpa perlu retensi, tanpa perlu integrasi pembayaran rumit.
2. **Kredit lamaran** — pembelian impulsif setelah sesi lamar pertama terasa berguna.
3. **Pro** — hanya setelah ada bukti pengguna kembali di bulan kedua.
4. **Perusahaan** — eksperimen validasi, bukan rencana pendapatan utama di tahun pertama.

> **Prinsip harga:** setiap angka di bawah ini adalah hipotesis dengan kriteria lulus/gagal, bukan harga final. Harga yang tidak punya kriteria uji akan dipertahankan karena ego, bukan karena data.

### 5.1 Jasa sekali bayar — mesin kas di bulan pertama

| Layanan | Harga | Biaya langsung | Margin kasar | Kenapa dijual lebih dulu |
| --- | ---: | ---: | ---: | --- |
| Review CV oleh Manusia | Rp49.000 | ±15 menit kerja | ±Rp40.000 | Pelanggan membayar untuk kepastian, bukan fitur. Bisa dijual sebelum produk selesai. |
| Buat CV ATS dari nol | Rp75.000 | ±30 menit kerja | ±Rp60.000 | Menutup celah ketika pembuat CV otomatis belum cukup bagus. |
| Paket "Lamaran Siap Kirim" (CV ATS + surat + 10 lamaran) | Rp99.000 | ±40 menit + kuota | ±Rp70.000 | Bundling yang mengajarkan nilai produk sekaligus memasukkan pengguna ke alur antrean. |

Target realistis 90 hari: **30–50 transaksi jasa**. Itu Rp1,5–4 juta yang membuktikan ada yang mau membayar, jauh sebelum pembayaran otomatis siap.

**Kriteria lulus:** minimal 10 transaksi berasal dari orang yang belum pernah kenal pendiri. Transaksi dari lingkaran sendiri tidak dihitung sebagai validasi.

### 5.2 Paket pelamar

| Paket | Harga | Isi utama | Perubahan dari versi lama |
| --- | --- | --- | --- |
| Gratis | Rp0 | 1 CV ATS; 3 lamaran / bulan; Skor CV 1x / bulan; penyimpanan 50 MB; filter kota + radius. | CV kreatif dikeluarkan dari Gratis — pindah ke Pro agar ada alasan naik paket. |
| Kredit Lamaran | Rp10.000 = 10 lamaran | Tanpa langganan, tidak hangus dalam 12 bulan. | Tetap. Ini produk dengan konversi terbaik karena sesuai kebiasaan "bayar kalau butuh sekarang". |
| Pro Bulanan | Rp29.000 / bulan | **Kirim massal via Gmail terhubung (OAuth)**; 50 lamaran / bulan; Skor CV 30x / bulan + saran AI; semua template; CV kreatif; penyimpanan 500 MB; notifikasi lowongan cocok. | "Skor CV tanpa batas" dihapus karena biaya AI tak berplafon. Gmail OAuth diangkat menjadi fitur utama, bukan opsi. |
| Pro Tahunan | Rp199.000 / tahun | Semua fitur Pro, efektif ±Rp16.600 / bulan. | Tetap sebagai jangkar harga. |

**Kenapa Gmail OAuth harus jadi wajah Pro:** ini satu-satunya fitur yang benar-benar memenuhi janji "1 klik" — email beserta lampiran terkirim tanpa pelamar menyentuh apa pun. Kalau Pro dijual dengan "50 lamaran" saja, pelanggan bisa mendapatkannya lewat kredit Rp10.000. Yang tidak bisa dibeli dengan kredit adalah *tidak perlu menekan Send sama sekali*. Jual itu.

**Plafon AI wajib ada.** Satu penilaian CV dengan LLM berbiaya nyata per panggilan. "Tanpa batas" pada harga Rp29.000 adalah kerugian yang menunggu terjadi. 30x/bulan cukup untuk pengguna wajar dan menahan penyalahgunaan.

### 5.3 Sisi perusahaan — validasi, bukan pendapatan utama

Rencana "UMKM Rp499.000/bulan" sebagai sumber pendapatan utama terlalu optimistis untuk tahap ini: UMKM yang mencari kasir dan admin hampir selalu memasang lowongan lewat Instagram, grup Facebook, dan WhatsApp — gratis. Menagih langganan sebelum mereka pernah melihat kandidat berkualitas adalah urutan yang salah.

| Tahap | Tawaran | Tujuan sebenarnya |
| --- | --- | --- |
| 10 perusahaan pertama | Pasang lowongan **gratis**, label "Dari Perusahaan Langsung" | Membuktikan ada perusahaan yang mau memakai kanal ini sama sekali. |
| Setelah itu | Rp199.000 / lowongan tayang 30 hari | Menguji apakah ada yang membayar setelah melihat hasil nyata (kandidat masuk). |
| Eksperimen lanjutan | Bayar per kandidat yang diwawancarai, atau per lowongan terisi | Model yang paling dekat dengan cara UMKM berpikir: bayar kalau dapat orang. |
| Ditunda | Paket UMKM bulanan Rp499.000 | Jangan dijual sebelum ada bukti satu pun perusahaan membayar per lowongan. |

**Kriteria lulus:** 3 dari 10 perusahaan pertama memasang lowongan **kedua** tanpa diminta. Kalau tidak ada yang memasang ulang, kanal perusahaan belum layak dibangun lagi.

### 5.4 Unit economics yang harus masuk hitungan

Sebelum menetapkan harga, hitung dulu biaya per pengguna aktif per bulan. Angka di bawah adalah perkiraan untuk perencanaan dan wajib diganti dengan tagihan nyata dari penyedia layanan.

| Komponen | Perkiraan per pengguna aktif / bulan | Catatan |
| --- | ---: | --- |
| Penyimpanan berkas | Rp1.000 – Rp3.000 | KTP, ijazah, transkrip, foto; 50–500 MB. |
| Penilaian CV AI (30x) | Rp3.000 – Rp10.000 | Bergantung model; ini alasan plafon wajib ada. |
| Email transaksional & notifikasi | Rp500 – Rp1.500 | Pendaftaran, pengingat, notifikasi lowongan. |
| Infrastruktur & basis data | Rp1.000 – Rp2.000 | Tergantung skala. |
| **Total biaya variabel** | **±Rp5.500 – Rp16.500** | |

Konsekuensinya jelas: **Pro Rp29.000 dengan Skor CV tanpa batas bisa mendekati nol margin atau rugi** pada pengguna berat. Dengan plafon 30x, margin Pro sehat di kisaran 40–70%. Kredit Rp10.000 untuk 10 lamaran hampir seluruhnya margin — dan itulah produk yang paling layak didorong.

### 5.5 Harga sebagai hipotesis: apa yang harus dibuktikan

| Hipotesis | Cara uji | Lulus jika | Jika gagal |
| --- | --- | --- | --- |
| Ada yang membayar untuk lamaran tambahan | Tawarkan kredit setelah kuota Gratis habis | ≥10% pengguna Gratis membeli kredit | Naikkan kuota Gratis; jangan turunkan harga dulu |
| Pengguna kembali di bulan kedua | Ukur pengguna aktif bulan ke-2 tanpa promosi | ≥25% kembali | Masalahnya aliran lowongan, bukan harga — perbaiki kurasi |
| Pro layak di Rp29.000 | Uji harga Rp19.000 / Rp29.000 / Rp39.000 ke kelompok berbeda | Rp29.000 menghasilkan pendapatan tertinggi, bukan sekadar konversi tertinggi | Turunkan ke Rp19.000 atau ubah Pro jadi Rp49.000 dengan Gmail OAuth sebagai inti |
| Perusahaan mau membayar | Tawarkan lowongan berbayar setelah 10 lowongan gratis | ≥3 dari 10 memasang ulang | Hentikan pengembangan sisi perusahaan, fokus ke pelamar |
| Jasa CV punya pasar | Iklankan Review CV Rp49.000 di luar lingkaran sendiri | ≥10 transaksi dari orang asing | Hentikan jasa manual, jangan dijadikan alasan menunda produk |

> **Aturan harga yang tidak boleh dilanggar:** jangan pernah menurunkan harga sebagai respons pertama terhadap konversi rendah. Konversi rendah hampir selalu masalah kejelasan nilai dan kepercayaan pada aliran lowongan — bukan masalah angka. Turunkan harga hanya setelah dua hipotesis di atas lulus dan konversi tetap rendah.

### Model data inti (untuk tim / developer)

- **User** — akun, paket, kredit, status koneksi Gmail
- **Profil** — pendidikan, pengalaman, keahlian, preferensi lokasi
- **Berkas** — jenis, file, ukuran, masa berlaku
- **CV** — versi ATS / kreatif, skor, saran, sisa kuota penilaian
- **Lowongan** — sumber, saluran lamar, status verifikasi, lokasi & koordinat
- **Lamaran** — pelamar, lowongan, surat yang dipakai, status terkirim, cara kirim (manual / Gmail OAuth)
- **Pesanan Jasa** — jenis jasa, harga, status pengerjaan, penanggung jawab
- **Transaksi** — paket, kredit, pembayaran perusahaan

---

## 6. Roadmap MVP 90 hari

| Fase | Ruang lingkup |
| --- | --- |
| Minggu 1–2 — Validasi & kas pertama | Pilih 1 kota pilot dan 1–2 kategori (misalnya admin + retail di Jabodetabek). Kumpulkan dan kurasi manual 50–100 lowongan valid. Wawancarai 10 pencari kerja. **Buka jualan Review CV Rp49.000 lewat WhatsApp/Instagram sejak hari pertama — jangan tunggu produk jadi.** |
| Minggu 3–6 — MVP Inti | Daftar / masuk, Profil Sekali Isi, Brankas Berkas, daftar lowongan + filter lokasi, Studio CV ATS sederhana + Skor CV versi aturan (rule-based), generator surat lamaran, dan antrian kirim via Email / WhatsApp / Google Form. |
| Minggu 7–10 — Monetisasi | Halaman Pesanan Jasa (alur order manual), Kuota Gratis, Kredit Lamaran, pembayaran (QRIS / e-wallet / transfer), halaman Riwayat Lamaran. **CV kreatif dan notifikasi lowongan cocok digeser ke Fase 2** — keduanya tidak memengaruhi keputusan bayar di bulan pertama. |
| Minggu 11–13 — Eksperimen perusahaan | Pasang lowongan **gratis** untuk 10 perusahaan pertama, label perusahaan langsung, dan pengumpulan testimoni pelamar yang berhasil dipanggil wawancara. Harga lowongan diuji setelah ada pemasangan ulang. |

### Yang sengaja tidak dibangun di MVP

- **Gmail OAuth untuk Pro** — ditunda ke Fase 2, tetapi harus menjadi item pertama setelah MVP; ini fitur yang membuat Pro punya alasan eksis.
- Pengiriman otomatis dari server platform ke semua portal perusahaan — terlalu banyak integrasi berbeda.
- Cakupan nasional sejak hari pertama — kurasi tidak akan sanggup menjaga validitasnya.
- Aplikasi mobile native — website yang nyaman di ponsel (mobile web) sudah cukup untuk validasi.
- Paket UMKM berlangganan — tidak dijual sebelum ada perusahaan yang membayar per lowongan.

### Risiko, keamanan data, dan legal

- **Enkripsi & akses:** berkas KTP dan ijazah dienkripsi saat disimpan, hanya dapat diakses pemiliknya, dan tautan berbagi CV memakai token yang dapat dicabut.
- **Hapus otomatis:** berkas yang tidak dipakai dalam 90 hari dihapus setelah pemberitahuan, sesuai janji penyimpanan terbatas.
- **Persetujuan eksplisit:** lokasi GPS hanya dipakai setelah izin browser diberikan; menghubungkan Gmail untuk kirim massal Pro memerlukan persetujuan terpisah yang dapat dicabut kapan saja.
- **Kepatuhan:** patuhi Undang-Undang Pelindungan Data Pribadi (UU PDP) — jelaskan data apa yang disimpan, untuk apa, dan sediakan tombol hapus akun beserta seluruh berkasnya.
- **Sumber lowongan:** cantumkan sumber asli setiap lowongan dan sediakan mekanisme lapor / minta penurunan (takedown) bagi perusahaan pemilik lowongan.

---

## 7. Ukur ini, lalu putuskan langkah berikutnya

| Indikator (KPI) | Mengapa penting |
| --- | --- |
| Aktivasi: profil lengkap + berkas pertama terunggah | Menunjukkan janji "sekali isi" benar-benar dipahami dan diselesaikan pengguna baru. |
| Lamaran terkirim per pengguna aktif | Bukti langsung bahwa antrian kirim menghemat waktu — target awal: rata-rata di atas 3 per sesi lamar. |
| Waktu rata-rata per lamaran | Angka pembanding utama melawan cara manual (sekitar 10 menit). Laporkan angka nyatanya setelah uji pengguna — jangan pakai angka rancangan. |
| Persentase lowongan yang masih valid | Diperiksa lewat audit mingguan sampel lowongan; di bawah 90% berarti kurasi harus diperketat sebelum menambah volume. Ini KPI paling penting: aliran lowongan adalah produknya. |
| Transaksi jasa (Review CV / Buat CV) | Pendapatan pertama yang bisa dicapai tanpa retensi. Target 90 hari: 30–50 transaksi, minimal 10 dari luar lingkaran sendiri. |
| Konversi Gratis ke Kredit | Menentukan apakah orang mau membayar untuk lamaran tambahan saat kuota habis. Target ≥10%. |
| Retensi bulan ke-2 | Menentukan apakah Pro layak ada. Target ≥25% pengguna kembali tanpa promosi. Di bawah itu, perbaiki kurasi lowongan — bukan harga. |
| Pemasangan ulang lowongan oleh perusahaan | Validasi sisi perusahaan. Target: 3 dari 10 perusahaan pertama memasang lowongan kedua tanpa diminta. |

### Tiga keputusan sebelum mulai membangun

1. **Nama platform** — pendek, mudah diucapkan, dan tersedia sebagai domain .id / .com serta nama pengguna media sosial.
2. **Kota pilot & kategori pertama** — satu kombinasi saja, misalnya Jabodetabek untuk admin dan retail, agar kurasi lowongan dapat dijaga manual.
3. **Siapa kurator pertama lowongan** — orang yang setiap hari memeriksa, menduplikasi-ulang, dan menurunkan lowongan. Tanpa peran ini, fitur lain tidak berarti.

---

## Kesimpulan

Bangun MVP-nya sempit dan rapi — profil sekali isi, brankas sekali upload, lowongan terkurasi per lokasi, antrian kirim dari akun pelamar sendiri, dan Skor CV. Empat hal itu adalah janji yang bisa dibuktikan pada sesi pertama, dan itu yang membuat pelamar mau membeli kredit dan jasa.

Uang masuk pertama tidak datang dari langganan. Ia datang dari jasa Review CV dan Buat CV yang bisa dijual minggu ini, sebelum produk selesai. Kredit menyusul sebagai pembelian spontan setelah sesi lamar pertama terasa berguna. Pro baru punya alasan ada ketika Gmail OAuth membuat "1 klik" menjadi kenyataan, dan perusahaan baru layak dikejar ketika ada yang memasang lowongan untuk kedua kalinya tanpa diminta.

Yang harus dijaga sepanjang waktu hanya satu: aliran lowongan yang benar-benar valid. Kalau kurasi berhenti, tidak ada harga, fitur, atau janji yang menyelamatkan platform ini.

*Catatan: seluruh harga, kuota, dan target dalam blueprint ini adalah rekomendasi awal berdasarkan diskusi perancangan produk, untuk divalidasi melalui uji pengguna dan penjualan pertama — bukan janji hasil.*
