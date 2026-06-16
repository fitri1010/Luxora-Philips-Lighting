# UI Design Guidelines
## Aplikasi Laporan Penjualan Shopee (Syariah Based)

---

**Versi Dokumen:** 1.0  
**Tanggal:** 8 Mei 2026  
**Penulis:** Safitri Haryanti
**Status:** Draft  
**Referensi:** PRD_App_Laporan_Penjualan_Shopee.md

---

## 1. Filosofi Desain
Tujuan utama dari antarmuka ini adalah memberikan **kejelasan (clarity)** dan **ketenangan (trust)** bagi penjual. Desain harus memadukan profesionalisme dasbor analitik modern dengan elemen visual yang mencerminkan nilai-nilai transparansi, akurasi, dan kepatuhan syariah seperti bebas gharar dan bebas zalim.

---

## 2. Palet Warna (Color Palette)

### 2.1 Warna Utama (Brand Colors)
* **Emerald Green (#2D5A27):** Warna utama untuk melambangkan pertumbuhan dan nilai syariah. Digunakan pada header dan tombol aksi utama.
* **Shopee Orange (#EE4D2D):** Digunakan sebagai aksen untuk menjaga konteks brand sumber data utama aplikasi.

### 2.2 Warna Status & Peringatan
* **Success (Green):** Digunakan pada kartu status jika angka return di bawah 1%.
* **Warning (Orange/Yellow):** Indikator untuk stok di bawah ambang batas minimum yaitu 5 pcs.
* **Critical (Red):** Digunakan untuk stok nol atau angka return di atas 5% dengan efek berkedip.

---

## 3. Tipografi (Typography)
* **Font Utama:** *Inter* atau *Roboto* (Sans Serif) untuk memastikan keterbacaan data angka pada tabel dan laporan keuangan.
* **Ukuran Font:**
    * **Heading 1 (24px):** Judul Halaman Utama.
    * **Body Text (14px):** Teks standar untuk detail transaksi.
    * **Data Labels (12px):** Label pada grafik dan keterangan tabel.

---

## 4. Komponen UI Khusus

### 4.1 Status Cards & Dashboard
* **KPI Cards:** Menampilkan Omzet Kotor, Laba Bersih, dan Rugi Risiko secara ringkas.
* **Trend Indicators:** Tanda panah kecil untuk menunjukkan kenaikan atau penurunan dibanding periode sebelumnya.
* **Geographical Map:** Peta interaktif untuk visualisasi distribusi pembeli berdasarkan provinsi dan kota.

### 4.2 Syariah Compliance Engine Visuals
* **Zakat Banner:** Banner khusus yang muncul otomatis jika Harta Wajib Zakat telah mencapai nishab emas terkini (kewajiban 2,5%).
* **Halal Revenue Tag:** Label "Verified Halal" pada pendapatan yang berasal dari pesanan berstatus "Selesai".
* **Transparency Tooltip:** Penjelasan eksplisit pada setiap biaya admin dan handling fee untuk memastikan aspek "Bebas Gharar".

### 4.3 AI Feedback Widget
* **Style:** Balon chat atau kartu dengan latar belakang biru muda atau hijau lembut.
* **Content:** Menampilkan teks insight otomatis yang membandingkan data hari ini dengan data historis.

---

## 5. Visualisasi Data (Charts)

| Jenis Visualisasi | Kegunaan |
| :--- | :--- |
| **Bar Chart** | Membandingkan pesanan sukses vs pesanan gagal (Batal vs Selesai). |
| **Line Chart** | Memantau tren performa penjualan harian dan laba bersih. |
| **Stock Meter** | Progress bar yang berubah warna (Kuning/Merah) sesuai level stok. |

---

## 6. Tata Letak (Layout) & Navigasi
* **Sidebar Navigasi:**
    1. **Dashboard Utama:** Ringkasan KPI & AI Insight.
    2. **Laporan Penjualan:** Data Transaksi & Geografis.
    3. **Manajemen Stok:** Update Stok & Alert.
    4. **Kepatuhan Syariah:** Kalkulator Zakat & Laba Al-Ribh.
    5. **Ekspor Data:** Menu untuk mengunduh format DOCX, PDF, dan XLSX.

---

## 7. Persyaratan Interaksi (Non-Fungsional)
* **Kecepatan Muat:** Dashboard harus memuat data dalam waktu kurang dari 3 detik untuk dataset hingga 10.000 transaksi.
* **Export Feedback:** Memberikan notifikasi sukses saat pengguna mengunduh laporan.
* **Keamanan:** Menampilkan indikator enkripsi data untuk menjamin keamanan transmisi informasi.