# 📦 Aplikasi Laporan Penjualan Shopee

> Dashboard penjualan terintegrasi untuk penjual Shopee — lengkap dengan laporan keuangan otomatis, manajemen stok real-time, dan fitur kepatuhan syariah.

---

## 🧭 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Instalasi](#instalasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Proyek](#struktur-proyek)
- [Syariah Compliance Engine](#syariah-compliance-engine)
- [Export Laporan](#export-laporan)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## 📌 Tentang Proyek

Aplikasi ini dirancang untuk membantu penjual di marketplace Shopee dalam mengelola dan memantau performa bisnis mereka secara menyeluruh. Data transaksi dapat dimasukkan melalui impor file CSV/Excel dari Shopee atau input manual, kemudian diolah otomatis menjadi laporan keuangan yang siap digunakan untuk rapat, audit, maupun perhitungan zakat.

**Masalah yang diselesaikan:**
- Biaya-biaya tersembunyi (admin fee, ongkir, packing) yang sulit dilacak manual
- Stok barang yang tidak terpantau hingga menyebabkan pesanan batal
- Tidak ada laporan laba bersih yang akurat dan transparan
- Kewajiban syariah (zakat mal) yang belum terhitung otomatis

---

## ✨ Fitur Utama

### 📊 Dashboard Real-Time
- Status card dengan indikator warna (hijau / merah) untuk memantau tingkat return
- Grafik batang perbandingan pesanan sukses vs pesanan gagal
- Peta distribusi geografis pembeli berdasarkan provinsi dan kota

### 🗃️ Manajemen Data Transaksi
- Pencatatan lengkap: ID Pesanan, SKU, Harga, Diskon, dan Status (`Selesai` / `Dibatalkan` / `Return`)
- Rekam biaya operasional: service fee, admin fee, ongkir, dan biaya pengemasan
- Analisis alasan pembatalan dan return

### 📦 Manajemen Stok Real-Time
- Update otomatis saat ada transaksi masuk, keluar, atau return
- Peringatan stok kuning/oranye saat mendekati batas minimum (default: 5 pcs)
- Alert merah saat stok habis, terhubung langsung ke laporan potensi pendapatan hilang

### 💰 Laporan Keuangan Otomatis

| Laporan | Keterangan |
|---|---|
| Omzet Kotor | Total semua pesanan masuk |
| Omzet Bersih | Omzet Kotor − Batal − Return |
| Beban Biaya | Admin fee + packing + ongkir seller |
| Laba Bersih | Omzet Bersih − Modal − Beban Biaya |
| Rugi Risiko | Kerugian dari packing/ongkir barang return |

### 🤖 AI Feedback Otomatis
Sistem membandingkan data hari ini dengan data historis dan memberikan insight yang dapat langsung ditindaklanjuti.

> *Contoh: "Penjualan naik 15% minggu ini, namun Laba Bersih turun 2% karena biaya iklan meningkat. Saran: kurangi bid iklan pada jam 00:00–06:00."*

---

## ☪️ Syariah Compliance Engine

Fitur ini memastikan pengelolaan keuangan sesuai prinsip syariah:

- **Laporan Al-Ribh** — Hanya mencatat pendapatan dari pesanan `Selesai` sebagai pendapatan halal
- **Bebas Gharar** — Setiap biaya tercatat eksplisit, tidak ada biaya siluman
- **Bebas Zalim** — Biaya pengiriman dipastikan tersalur ke kurir, kelebihan dikembalikan ke pembeli
- **Zakat Mal Otomatis** — Menghitung kewajiban zakat 2,5% berdasarkan harga emas terkini

> Dashboard akan menampilkan notifikasi: *"Harta Anda telah mencapai Nishab, kewajiban Zakat: Rp [Jumlah]"*

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|---|---|
| Database | Relasional (domain Transaksi, Operasional, Stok, Risiko, Geografis) |
| API Eksternal | API harga emas (untuk kalkulasi nishab zakat) |
| AI Engine | Model analitik komparasi data historis |
| Export Engine | Generator file DOCX, PDF, dan XLSX |

---

## 🚀 Instalasi

```bash
# Clone repositori
git clone https://github.com/username/laporan-shopee.git

# Masuk ke direktori proyek
cd laporan-shopee

# Install dependensi
npm install
# atau
pip install -r requirements.txt

# Salin file environment
cp .env.example .env

# Jalankan aplikasi
npm run dev
```

> **Catatan:** Pastikan mengisi konfigurasi API harga emas pada file `.env` untuk mengaktifkan fitur kalkulasi zakat.

---

## 📖 Cara Penggunaan

1. **Import Data** — Unggah file CSV/Excel dari laporan Shopee, atau input transaksi secara manual
2. **Pantau Dashboard** — Lihat status penjualan, stok, dan peringatan return secara real-time
3. **Baca Laporan Keuangan** — Cek omzet, laba bersih, dan beban biaya secara otomatis
4. **Cek Status Syariah** — Pantau status zakat dan kepatuhan syariah di panel khusus
5. **Baca AI Feedback** — Tindaklanjuti rekomendasi yang dihasilkan sistem
6. **Export Laporan** — Unduh laporan dalam format DOCX, PDF, atau XLSX

---

## 🗂️ Struktur Proyek

```
laporan-shopee/
├── src/
│   ├── modules/
│   │   ├── transaksi/        # Domain data penjualan
│   │   ├── operasional/      # Domain data biaya
│   │   ├── stok/             # Manajemen inventori
│   │   ├── risiko/           # Batal & return
│   │   ├── geografis/        # Peta pembeli
│   │   └── syariah/          # Compliance engine & zakat
│   ├── dashboard/            # Komponen UI & visualisasi
│   ├── ai/                   # Modul feedback & analitik
│   └── export/               # Generator DOCX, PDF, XLSX
├── docs/
│   ├── PRD_App_Laporan_Penjualan_Shopee.md
│   └── README.md
├── .env.example
└── README.md
```

---

## 📤 Export Laporan

Aplikasi menghasilkan tiga jenis output:

| Format | Isi | Kegunaan |
|---|---|---|
| `.docx` | Ringkasan laporan keuangan | Rapat, presentasi, arsip |
| `.pdf` | Ringkasan laporan keuangan | Audit, pengiriman ke pihak lain |
| `.xlsx` | Data mentah seluruh transaksi | Analisis mendalam di Excel |

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Silakan ikuti langkah berikut:

1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur/nama-fitur`)
5. Buka Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

> Dibuat dengan ❤️ oleh **Safitri Haryanti** — v1.0, Mei 2026
