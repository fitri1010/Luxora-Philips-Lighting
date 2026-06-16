# Product Backlog - Aplikasi Laporan Penjualan Shopee (Syariah-Based)

Dokumen ini mendokumentasikan daftar lengkap seluruh fungsionalitas, persyaratan keamanan, tugas teknis, dan rencana pengembangan masa depan untuk **Aplikasi Laporan Penjualan Shopee berbasis Syariah**. Backlog ini dikembangkan berdasarkan analisis komprehensif terhadap seluruh dokumen spesifikasi di folder `docs` (PRD, Business Rules, Compliance, Architecture, Security, dan AI Spec).

Dokumen ini dirancang sebagai panduan bagi pemilik toko (Safitri Haryanti) dan penguji/dosen (bu dewi febriani) untuk memantau fitur apa saja yang **telah diimplementasikan pada Prototype SPA v1.0** serta fitur-fitur **yang masuk dalam antrean pengembangan sistem produksi skala besar**.

---

## 📋 Struktur Prioritas & Status
*   **Prioritas:**
    *   🔴 **Tinggi (High):** Fitur utama, kalkulasi keuangan syariah, atau keamanan kritis. Wajib diselesaikan sebelum peluncuran produksi.
    *   🟡 **Sedang (Medium):** Wawasan AI, ekspor riil, otomasi stok, atau antarmuka pelengkap.
    *   🟢 **Rendah (Low):** Fitur operasional tambahan, bot WhatsApp, dan optimasi non-kritikal.
*   **Status Backlog:**
    *   ✅ **Selesai (Completed - SPA v1.0):** Telah diimplementasikan penuh secara interaktif pada purwarupa Single Page Application client-side.
    *   🚀 **Terencana (Planned):** Direncanakan pada sprint pengembangan backend terdekat.
    *   🗺️ **Roadmap Masa Depan (Future Roadmap):** Direncanakan untuk rilis versi berkelanjutan (v2.0+).

---

## 📂 DAFTAR BACKLOG ITEM (PRODUCT BACKLOG ITEMS - PBI)

### 1. Fungsionalitas Keuangan & Transaksi (Domain Keuangan)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-TRX-001** | Rekaman data transaksi penjualan terperinci (ID Pesanan, nama produk/SKU, harga bersih, diskon, dan status pesanan). | PRD v1.0 (F-01, F-02) | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-TRX-002** | Perhitungan biaya administrasi marketplace, service fee Shopee, packing fee, dan ongkos kirim seller secara eksplisit. | PRD v1.0 (F-03, F-04, F-05) | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-TRX-003** | Pencatatan & klasifikasi pesanan gagal (Dibatalkan & Return) beserta alasan pembatalan/retur. | PRD v1.0 (F-06, F-07, F-08) | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-TRX-004** | Agregasi dan analisis geografis provinsi dan kota pengiriman pembeli untuk melacak loyalitas daerah. | PRD v1.0 (F-09, F-10) | 🟡 Sedang | Sprint 2 | ✅ Selesai (SPA v1.0) |
| **PB-TRX-005** | Engine impor massal berkas CSV/Excel laporan transaksi asli hasil ekspor dari Seller Center Shopee. | PRD v1.0 (F-01), BR-ROLE-001 | 🔴 Tinggi | Sprint 2 | 🚀 Terencana (Backend) |
| **PB-TRX-006** | Fitur unggah berkas resi atau invoice fisik disertai OCR (Optical Character Recognition) otomatis untuk transaksi manual. | SECURITY v1.0 (1.4.3), PRD | 🟡 Sedang | Sprint 3 | 🚀 Terencana (AI Backend) |

---

### 2. Manajemen Inventori & Persediaan Stok (Domain Stok)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-STK-001** | Mutasi stok barang otomatis saat pesanan masuk (outbound), stok masuk (inbound), dan barang retur layak jual (return). | PRD v1.0 (F-11) | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-STK-002** | Alarm visual level stok berbasis warna: **Hijau** (Cukup), **Kuning** (Menipis < 5 pcs), dan **Merah Berkedip** (Kosong/0 pcs). | PRD v1.0 (F-12, F-13), UI Guidelines | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-STK-003** | Kalkulator potensi pendapatan yang hilang (*Lost Revenue*) akibat pembatalan karena persediaan kosong. | PRD v1.0 (F-14) | 🟡 Sedang | Sprint 2 | ✅ Selesai (SPA v1.0) |
| **PB-STK-004** | Formulir stok masuk (Inbound) interaktif untuk memperbarui persediaan, nilai stok, dan modal barang. | PRD v1.0 (F-11) | 🟡 Sedang | Sprint 2 | ✅ Selesai (SPA v1.0) |
| **PB-STK-005** | Fitur penyesuaian ambang batas (threshold) alarm stok menipis secara dinamis per item barang oleh Owner. | PRD v1.0 (F-12) | 🟢 Rendah | Sprint 4 | 🚀 Terencana (Backend) |

---

### 3. Syariah Compliance Engine (Domain Syariah)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-SYR-001** | Klasifikasi Laba Bersih Halal (Al-Ribh) yang hanya mengakui pendapatan dari transaksi berstatus `Selesai`. | PRD v1.0 (F-17, F-18), BUSINESS_RULES | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-SYR-002** | Audit Bebas Gharar dengan transparansi visual tooltip biaya admin, service fee, dan handling fee per transaksi. | PRD v1.0 (F-20), COMPLIANCE v1.0 | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-SYR-003** | Audit Bebas Zalim untuk mendeteksi selisih lebih (overcharge) ongkos kirim pembeli terhadap tagihan riil ekspedisi. | PRD v1.0 (F-21), COMPLIANCE v1.0 | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-SYR-004** | Banner Peringatan Zakat Mal otomatis pada dashboard jika total Harta Wajib Zakat (HWZ) mencapai nishab emas harian. | PRD v1.0 (F-25), BUSINESS_RULES | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-SYR-005** | Kalkulator Zakat Mal Dagang interaktif dengan rumus BAZNAS: `Kas + Nilai Stok Barang − Utang Jatuh Tempo`. | PRD v1.0 (F-23, F-24), COMPLIANCE | 🔴 Tinggi | Sprint 1 | ✅ Selesai (SPA v1.0) |
| **PB-SYR-006** | Integrasi real-time API Harga Emas terkini (BAZNAS / Logam Mulia Antam) untuk dasar perhitungan nishab 85 gram emas. | PRD v1.0 (F-22), DEV_GUIDE v1.0 | 🟡 Sedang | Sprint 3 | 🚀 Terencana (Integration) |
| **PB-SYR-007** | Fitur integrasi sistem penyaluran zakat langsung ke LAZ resmi (Lembaga Amil Zakat) dengan laporan penyaluran transparan. | BUSINESS_RULES (Seksi 7) | 🟢 Rendah | Sprint 5 | 🚀 Terencana (Integration) |

---

### 4. Kecerdasan Buatan & Wawasan AI (Domain AI Engine)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-AI-001** | Panel AI Feedback interaktif untuk menyajikan rekomendasi analitis kesehatan penjualan toko dibanding data historis. | PRD v1.0 (F-30, F-31), AI_SPEC v1.0 | 🟡 Sedang | Sprint 2 | ✅ Selesai (SPA v1.0) |
| **PB-AI-002** | Deteksi Anomali Biaya Operasional (Shopee Ads membengkak tajam pada jam-jam tidak efektif). | PRD v1.0 (Contoh AI), AI_SPEC v1.0 | 🟡 Sedang | Sprint 3 | 🚀 Terencana (AI Backend) |
| **PB-AI-003** | Proteksi Prompt Injection dan pembersihan input (input sanitization) pada formulir asisten AI. | SECURITY v1.0 (1.4.2) | 🔴 Tinggi | Sprint 2 | 🚀 Terencana (Security) |

---

### 5. Ekspor Dokumen & Pelaporan (Domain Export)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-EXP-001** | Fitur unduh laporan pembukuan syariah terenkripsi berformat dokumen cetak PDF. | PRD v1.0 (F-32), DEV_GUIDE v1.0 | 🟡 Sedang | Sprint 2 | 🚀 Terencana (Integration) |
| **PB-EXP-002** | Fitur unduh buku besar detail transaksi mentah berformat Microsoft Excel (.xlsx). | PRD v1.0 (F-33), DEV_GUIDE v1.0 | 🟡 Sedang | Sprint 2 | 🚀 Terencana (Integration) |
| **PB-EXP-003** | Fitur unduh rancangan narasi laporan keuangan siap sunting berformat Microsoft Word (.docx). | PRD v1.0 (F-32), DEV_GUIDE v1.0 | 🟡 Sedang | Sprint 3 | 🚀 Terencana (Integration) |
| **PB-EXP-004** | Penerapan Tanda Tangan Digital Kriptografi untuk menjamin keabsahan berkas PDF laporan Al-Ribh di hadapan auditor. | SECURITY v1.0, walkthrough.md | 🟡 Sedang | Sprint 3 | 🚀 Terencana (Security) |
| **PB-EXP-005** | Simulasi kemajuan kompilasi dokumen (Progress Bar 0-100%) dan Sliding Success Toast Notification untuk ekspor berkas. | PRD v1.0 (NF-05), UI Guidelines | 🟡 Sedang | Sprint 1 | ✅ Selesai (SPA v1.0) |

---

### 6. Keamanan, Infrastruktur & Non-Fungsional (Domain Security)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-SEC-001** | Pembatasan hak data multi-tenant isolation secara ketat di tingkat database query berdasarkan `toko_id` dari JWT token. | SECURITY v1.0 (1.3.3) | 🔴 Tinggi | Sprint 2 | 🚀 Terencana (Security) |
| **PB-SEC-002** | Enkripsi data sensitif (PII - Nama/Kontak Pembeli) di tingkat database kolom menggunakan AES-256 (kepatuhan UU PDP No.27/2022). | SECURITY v1.0 (1.5.1), PRD | 🔴 Tinggi | Sprint 3 | 🚀 Terencana (Security) |
| **PB-SEC-003** | Pembatasan beban server (Rate Limiting) per endpoint (auth login, upload resi, AI call, API transaksi) mencegah brute force. | SECURITY v1.0 (1.6.1) | 🔴 Tinggi | Sprint 2 | 🚀 Terencana (Security) |
| **PB-SEC-004** | Autentikasi JWT RS256 asimetris dipadukan RBAC (Role-Based Access Control) untuk role Owner, Staff, dan Accountant. | SECURITY v1.0 (1.3.1, 1.3.2) | 🔴 Tinggi | Sprint 2 | 🚀 Terencana (Security) |
| **PB-SEC-005** | Otomatisasi pencadangan database harian, mingguan, bulanan, tahunan dengan retensi multi-tahun sesuai aturan pajak/audit. | SECURITY v1.0 (3.0) | 🔴 Tinggi | Sprint 3 | 🚀 Terencana (Ops) |

---

### 7. Integrasi Eksternal & Multi-Platform (Roadmap Masa Depan)

| ID Backlog | Nama Fitur / Deskripsi Tugas | Referensi Dokumen | Prioritas | Estimasi Rilis | Status Saat Ini |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PB-INT-001** | Integrasi API resmi Shopee Open Platform untuk melakukan sinkronisasi pesanan otomatis dari Seller Center secara real-time. | PRD v1.0 (8.0 & 9.0) | 🔴 Tinggi | Future v1.5 | 🗺️ Roadmap Masa Depan |
| **PB-INT-002** | Integrasi Bot Notifikasi WhatsApp untuk pengiriman periodik level stok tipis, rangkuman omzet harian, dan haul zakat. | BUSINESS_RULES (Seksi 10) | 🟢 Rendah | Future v1.8 | 🗺️ Roadmap Masa Depan |
| **PB-INT-003** | Ekspansi fitur integrasi multi-platform marketplace lain (Tokopedia, Lazada, TikTok Shop, dll.) untuk analitik omzet agregat. | PRD v1.0 (8.0 - Out of Scope) | 🟡 Sedang | Future v2.0 | 🗺️ Roadmap Masa Depan |
| **PB-INT-004** | Pengembangan aplikasi versi mobile (Android & iOS) untuk kemudahan akses portabel pemilik toko. | PRD v1.0 (8.0 - Out of Scope) | 🟡 Sedang | Future v2.5 | 🗺️ Roadmap Masa Depan |

---

## 📈 Rencana Sprint & Milestone

Berdasarkan prioritas dan estimasi rilis backlog di atas, berikut adalah gambaran rencana milestone pengembangan ke depan:

```
 Purwarupa SPA v1.0 [SELESAI]
         │
         ▼
 Sprint 1 & 2: Fondasi Backend & Keamanan (Kritikal) [🔴 Prioritas Tinggi]
 ├── Setup FastAPI & JWT RS256 (PB-SEC-004)
 ├── Multi-Tenant Isolation (PB-SEC-001) & Rate Limiting (PB-SEC-003)
 ├── Impor Laporan CSV Shopee (PB-TRX-005)
 └── Zakat Mal Calculator & Al-Ribh Engine (PB-SYR-005, PB-SYR-001)
         │
         ▼
 Sprint 3 & 4: Fitur Integrasi & Ekspor Dokumen [🟡 Prioritas Sedang]
 ├── Ekspor PDF & XLSX Riil (PB-EXP-001, PB-EXP-002)
 ├── Integrasi API Emas Antam (PB-SYR-006)
 ├── Enkripsi Kolom PII UU PDP (PB-SEC-002)
 ├── AI Anomali Iklan & Prompt Hardening (PB-AI-002, PB-AI-003)
 └── Upload & OCR Resi/Invoice (PB-TRX-006)
         │
         ▼
 Future Releases: Otomasi Shopee & Multi-Platform [🗺️ Roadmap Masa Depan]
 ├── API Shopee Open Platform Sync (PB-INT-001)
 ├── WhatsApp Bot Notification (PB-INT-002)
 └── Ekspansi Tokopedia/Lazada & Mobile App (PB-INT-003, PB-INT-004)
```

---

*Dokumen backlog ini bersifat dinamis (living document) dan akan disesuaikan secara periodik mengikuti prioritas bisnis toko serta masukan dari tim penguji.*
