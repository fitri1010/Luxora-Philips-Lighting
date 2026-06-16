# Product Requirements Document (PRD)
## Aplikasi Laporan Penjualan dari Marketplace Shopee

---

**Versi Dokumen:** 1.0  
**Tanggal:** 1 Mei 2026  
**Penulis:** Safitri Haryanti  
**Status:** Draft

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan persyaratan produk untuk **Aplikasi Laporan Penjualan Shopee** — sebuah dashboard penjualan terintegrasi yang dirancang khusus untuk penjual di marketplace Shopee. Aplikasi ini mampu menerima berbagai format data transaksi (dari marketplace atau input manual), mengolahnya secara otomatis, dan menyajikan laporan keuangan yang komprehensif berbasis prinsip syariah.

---

## 2. Latar Belakang & Tujuan

### 2.1 Masalah yang Diselesaikan
Penjual di Shopee menghadapi tantangan dalam:
- Memantau performa penjualan secara real-time dan akurat
- Menghitung laba bersih setelah memotong biaya-biaya tersembunyi (admin fee, ongkir, packing)
- Mengelola stok barang dan mengantisipasi kehabisan stok
- Memantau order yang batal dan return secara terstruktur
- Memenuhi kewajiban syariah (zakat, bebas gharar, bebas zalim)

### 2.2 Tujuan Produk
1. Mengotomatisasi pencatatan dan pelaporan data penjualan Shopee
2. Memberikan visibilitas penuh atas laba bersih setelah semua beban biaya
3. Menyediakan fitur *Syariah Compliance Engine* untuk perhitungan zakat dan kepatuhan syariah
4. Menghasilkan laporan siap pakai dalam format DOCX, PDF, dan XLSX

---

## 3. Pengguna Target (User Persona)

| Persona | Deskripsi |
|---|---|
| **Penjual Aktif Shopee** | Individu atau UMKM yang berjualan di Shopee, membutuhkan laporan keuangan yang mudah dipahami |
| **Pemilik Toko** | Memantau kesehatan bisnis secara keseluruhan dan mengevaluasi performa produk |
| **Pengelola Keuangan** | Membutuhkan data akurat untuk audit, pembukuan, dan perhitungan zakat |

---

## 4. Fitur & Persyaratan Fungsional

### 4.1 Arsitektur Data (Database Domain)

#### 4.1.1 Domain Transaksi (Data Penjualan)
- **F-01:** Sistem menyimpan data transaksi meliputi: ID Pesanan, Nama Produk (SKU), Harga Asli, dan Diskon
- **F-02:** Sistem memberikan label status pada setiap pesanan: `Selesai`, `Dibatalkan`, atau `Dikembalikan (Return)`

#### 4.1.2 Domain Operasional (Data Biaya)
- **F-03:** Sistem mencatat biaya marketplace: Service Fee dan Admin Fee Shopee
- **F-04:** Sistem mencatat biaya pengiriman: ongkir yang ditanggung penjual dan handling fee
- **F-05:** Sistem mencatat biaya pengemasan: kardus, bubble wrap, dan isolasi

#### 4.1.3 Domain Risiko (Batal & Return)
- **F-06:** Sistem mencatat jumlah pesanan yang gagal diproses (order batal)
- **F-07:** Sistem mencatat barang yang kembali ke gudang (order return)
- **F-08:** Sistem mencatat dan menganalisis alasan pembatalan/pengembalian (contoh: barang rusak, salah ukuran, kurir lambat)

#### 4.1.4 Domain Geografis (Peta Pembeli)
- **F-09:** Sistem mencatat provinsi dan kota pembeli
- **F-10:** Sistem mengidentifikasi daerah dengan loyalitas tertinggi dan daerah dengan tingkat return tertinggi

---

### 4.2 Manajemen Stok Real-Time

- **F-11:** Sistem memperbarui stok secara otomatis pada setiap aktivitas:
  - **Stok Masuk (Inbound):** Penambahan stok
  - **Stok Keluar (Outbound):** Pengurangan otomatis saat ada pesanan masuk
  - **Stok Kembali (Return):** Penambahan stok jika barang return masih layak jual

#### 4.2.1 Peringatan Stok (Stock Alert)
- **F-12:** Sistem menampilkan **indikator warna kuning/oranye** jika stok di bawah ambang batas minimum (default: 5 pcs)
- **F-13:** Sistem menampilkan **indikator warna merah** jika stok nol (out of stock)
- **F-14:** Sistem menghubungkan data out-of-stock dengan laporan "Pesanan Dibatalkan" untuk menghitung potensi pendapatan yang hilang

---

### 4.3 Laporan Keuangan Otomatis

Sistem menghasilkan laporan keuangan berdasarkan formula berikut:

| Judul Laporan | Formula |
|---|---|
| **Omzet Kotor** | Total semua pesanan yang masuk |
| **Omzet Bersih** | Omzet Kotor − Pesanan Batal − Return |
| **Beban Biaya** | Total biaya admin + biaya packing + ongkir seller |
| **Laba Bersih** | Omzet Bersih − Modal Barang − Beban Biaya |
| **Rugi Risiko** | Total kerugian dari biaya packing/ongkir pada barang return |

- **F-15:** Sistem menghitung dan menampilkan semua laporan di atas secara otomatis
- **F-16:** Laporan diperbarui secara real-time setiap ada transaksi baru

---

### 4.4 Syariah Compliance Engine

#### 4.4.1 Laporan Laba Rugi Bersih (Al-Ribh)
- **F-17:** Sistem hanya mencatat pendapatan dari pesanan berstatus **"Selesai"** sebagai pendapatan halal
- **F-18:** Uang dari pesanan dibatalkan/return tidak dihitung sebagai pendapatan
- **F-19:** Sistem memotong biaya admin marketplace dan biaya packing secara transparan

#### 4.4.2 Laporan Arus Kas (Cash Flow) dengan Flagging Syariah
- **F-20 (Bebas Gharar):** Sistem memastikan setiap biaya (termasuk handling fee) tercatat nilainya secara eksplisit
- **F-21 (Bebas Zalim):** Sistem memverifikasi bahwa biaya pengiriman yang dibayar pembeli disalurkan ke kurir/logistik, dan kelebihan dikembalikan ke pembeli

#### 4.4.3 Laporan Perhitungan Zakat Mal
- **F-22:** Sistem mengambil data harga emas terbaru untuk menentukan nishab
- **F-23:** Sistem menghitung **Harta Wajib Zakat** dengan formula:
  > Uang Tunai (Saldo) + Nilai Stok Barang − Hutang Jangka Pendek
- **F-24:** Jika harta mencapai nishab, sistem menghitung kewajiban zakat sebesar **2,5%**
- **F-25:** Dashboard menampilkan indikator flagging: *"Harta Anda telah mencapai Nishab, kewajiban Zakat: Rp [Jumlah]"*

---

### 4.5 Dashboard & Visualisasi

#### 4.5.1 Status Card (Lampu Peringatan)
- **F-26:** Kartu status berwarna **hijau** jika angka return di bawah 1%
- **F-27:** Kartu status berwarna **merah berkedip** jika angka return di atas 5%, sebagai peringatan untuk mengecek kualitas produk atau kurir

#### 4.5.2 Grafik & Chart
- **F-28:** Grafik batang yang membandingkan pesanan sukses vs pesanan gagal (Batal vs Selesai)
- **F-29:** Peta geografis menampilkan distribusi pembeli berdasarkan provinsi dan kota

---

### 4.6 AI Feedback & Analisa Kesehatan Penjualan

- **F-30:** Sistem AI membandingkan data hari ini dengan data historis secara otomatis
- **F-31:** AI menghasilkan feedback berupa teks insight yang dapat ditindaklanjuti

> **Contoh Output AI:**
> *"Penjualan Anda naik 15% minggu ini, namun Laba Bersih turun 2%. Ini terjadi karena biaya iklan (Ads) di Shopee meningkat tajam untuk produk Lampu LED. Saran: Kurangi bid iklan pada jam-jam sepi (00:00–06:00) untuk efisiensi."*

---

### 4.7 Export & Output Laporan

- **F-32:** Sistem menghasilkan **Draft Laporan Keuangan** dalam format DOCX dan PDF (ringkasan siap sunting)
- **F-33:** Sistem menghasilkan **Tabel Detail** dalam format XLSX (data mentah untuk analisis di Excel)

---

## 5. Persyaratan Non-Fungsional

| ID | Kategori | Persyaratan |
|---|---|---|
| NF-01 | Performa | Dashboard memuat data dalam < 3 detik untuk dataset hingga 10.000 transaksi |
| NF-02 | Keandalan | Ketersediaan sistem minimal 99,5% (uptime) |
| NF-03 | Keamanan | Data transaksi dienkripsi saat penyimpanan dan transmisi |
| NF-04 | Skalabilitas | Sistem mampu menangani pertumbuhan data hingga 100.000+ transaksi per tahun |
| NF-05 | Kemudahan Penggunaan | Antarmuka dapat digunakan tanpa pelatihan teknis oleh penjual awam |
| NF-06 | Akurasi Data | Kalkulasi keuangan harus akurat 100% dan dapat diaudit |

---

## 6. Alur Pengguna (User Flow)

```
Input Data Transaksi (Shopee / Manual)
        ↓
Validasi & Kategorisasi Data
        ↓
Pembaruan Database (Transaksi, Biaya, Stok, Return)
        ↓
Pemrosesan Kalkulasi Otomatis
        ↓
┌─────────────────────────────────────────┐
│           Dashboard Utama               │
│  - Status Card (Return Alert)           │
│  - Grafik Penjualan                     │
│  - Laporan Keuangan Ringkas             │
│  - Syariah Compliance Status            │
│  - AI Feedback                          │
└─────────────────────────────────────────┘
        ↓
Export Laporan (DOCX / PDF / XLSX)
```

---

## 7. Kriteria Penerimaan (Acceptance Criteria)

| ID Fitur | Kriteria Penerimaan |
|---|---|
| F-01 s/d F-05 | Semua field data tersimpan dengan benar dan dapat diambil kembali tanpa kehilangan data |
| F-12 s/d F-14 | Indikator peringatan stok muncul sesuai threshold yang ditetapkan dan terhubung dengan laporan batal |
| F-15 s/d F-16 | Semua formula laporan keuangan menghasilkan angka yang konsisten dan dapat diverifikasi manual |
| F-22 s/d F-25 | Perhitungan zakat akurat berdasarkan harga emas terkini dan formula yang benar |
| F-30 s/d F-31 | AI Feedback muncul otomatis dan relevan dengan kondisi data terkini |
| F-32 s/d F-33 | File export terbuka sempurna di Microsoft Word, Adobe Acrobat, dan Microsoft Excel |

---

## 8. Asumsi & Batasan

### Asumsi
- Pengguna memiliki akun Shopee aktif sebagai penjual
- Data transaksi dapat diimpor dari file CSV/Excel laporan Shopee atau diinput secara manual
- Koneksi internet diperlukan untuk mengambil data harga emas terkini (untuk kalkulasi zakat)

### Batasan (Out of Scope - v1.0)
- Integrasi multi-platform (Tokopedia, Lazada, dll.) — direncanakan untuk versi mendatang
- Fitur manajemen iklan (Shopee Ads) secara langsung
- Aplikasi mobile (fase pertama hanya web)

---

## 9. Dependensi Teknis

| Komponen | Kebutuhan |
|---|---|
| Database | Struktur relasional yang mendukung domain Transaksi, Operasional, Stok, Risiko, Geografis |
| API Eksternal | API harga emas untuk kalkulasi nishab zakat |
| AI Engine | Model analitik untuk komparasi data historis dan feedback otomatis |
| Export Engine | Library untuk generate file DOCX, PDF, dan XLSX |

---

## 10. Riwayat Dokumen

| Versi | Tanggal | Penulis | Perubahan |
|---|---|---|---|
| 1.0 | 1 Mei 2026 | Safitri Haryanti | Dokumen awal dibuat dari Blueprint |

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan produk.*
