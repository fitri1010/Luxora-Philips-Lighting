# AI_SPEC.md
## Spesifikasi Teknis AI & Integrasi Sistem
### Aplikasi Laporan Penjualan Shopee

---

**Versi Dokumen:** 1.0  
**Tanggal:** 4 Mei 2026  
**Penulis:** [AI Engineer / Tech Lead]  
**Referensi PRD:** PRD_App_Laporan_Penjualan_Shopee v1.0 — Safitri Haryanti  
**Status:** Draft untuk Review Internal

---

## DAFTAR ISI

1. [AI Prompt Registry](#1-ai-prompt-registry)
2. [OCR Integration Specification](#2-ocr-integration-specification)
3. [WhatsApp Bot Flow](#3-whatsapp-bot-flow)
4. [Integration Contracts](#4-integration-contracts)
5. [Error Handling & Fallback Strategy](#5-error-handling--fallback-strategy)
6. [Security & Compliance Notes](#6-security--compliance-notes)

---

## 1. AI PROMPT REGISTRY

### 1.1 Gambaran Umum

AI Prompt Registry adalah katalog terpusat dan terdokumentasi dari semua prompt yang digunakan sistem AI dalam aplikasi. Setiap prompt dikodekan, diversi, dan diuji sebelum masuk ke production. Tidak ada prompt yang boleh di-hardcode langsung di dalam kode aplikasi — semua harus merujuk ke registry ini.

**Konvensi Penamaan:**
```
PROMPT-[DOMAIN]-[NOMOR]
Domain: FINANCE | STOCK | SYARIAH | OCR | BOT | REPORT
```

---

### 1.2 Registry Prompt

---

#### PROMPT-FINANCE-001
**Nama:** Sales Health Feedback Generator  
**Dipanggil oleh:** F-30, F-31 (AI Feedback & Analisa Kesehatan)  
**Model Target:** claude-sonnet-4-20250514 atau setara  
**Max Tokens:** 500  
**Temperature:** 0.4 (konsisten, faktual)

**System Prompt:**
```
Kamu adalah analis keuangan UMKM yang spesialis di marketplace Shopee Indonesia.
Tugasmu adalah menganalisis data penjualan harian dan memberikan insight yang 
actionable dalam Bahasa Indonesia yang mudah dipahami oleh penjual awam.

Aturan output:
- Maksimal 3 paragraf pendek
- Selalu sertakan 1 angka perbandingan (hari ini vs kemarin atau minggu ini vs minggu lalu)
- Selalu akhiri dengan 1 saran konkret yang bisa langsung dilakukan
- Jangan gunakan istilah teknis tanpa penjelasan
- Nada: profesional tapi ramah, seperti konsultan bisnis yang peduli
```

**User Prompt Template:**
```
Berikut adalah data penjualan toko:

Periode: {{PERIODE}}
Omzet Hari Ini: Rp {{OMZET_HARI_INI}}
Omzet Kemarin: Rp {{OMZET_KEMARIN}}
Laba Bersih Hari Ini: Rp {{LABA_BERSIH_HARI_INI}}
Laba Bersih Kemarin: Rp {{LABA_BERSIH_KEMARIN}}
Jumlah Order Selesai: {{ORDER_SELESAI}}
Jumlah Order Batal: {{ORDER_BATAL}}
Jumlah Return: {{ORDER_RETURN}}
Produk Terlaris: {{PRODUK_TERLARIS}}
Biaya Iklan (Ads): Rp {{BIAYA_ADS}}
Biaya Packing: Rp {{BIAYA_PACKING}}
Stok Menipis (<5 pcs): {{DAFTAR_STOK_TIPIS}}

Berikan analisis kesehatan penjualan dan saran yang actionable.
```

**Expected Output Format:**
```
[Paragraf 1: Ringkasan performa — naik/turun berapa persen]
[Paragraf 2: Identifikasi masalah utama (jika ada) + faktor penyebab]
[Saran: Satu tindakan konkret yang bisa dilakukan sekarang]
```

**Contoh Output:**
```
Penjualan Anda naik 15% minggu ini (Rp 4.200.000 vs Rp 3.650.000), 
namun Laba Bersih justru turun 2% menjadi Rp 980.000. 

Ini terjadi karena biaya iklan (Shopee Ads) meningkat tajam untuk 
produk Lampu LED — menyedot Rp 420.000 dari margin Anda. Selain itu, 
3 pesanan batal karena stok habis, setara potensi hilang Rp 195.000.

Saran: Kurangi bid iklan pada jam sepi (00.00–06.00 WIB) dan segera 
tambah stok Lampu LED minimal 10 pcs untuk mencegah kehilangan order.
```

**Validasi Output:**
- [ ] Mengandung angka perbandingan (persentase atau nominal)
- [ ] Panjang antara 80–200 kata
- [ ] Diakhiri dengan satu kalimat saran
- [ ] Tidak mengandung karakter aneh atau placeholder yang tidak terisi

---

#### PROMPT-SYARIAH-001
**Nama:** Zakat Mal Calculator & Notifier  
**Dipanggil oleh:** F-22, F-23, F-24, F-25  
**Model Target:** claude-sonnet-4-20250514  
**Max Tokens:** 300  
**Temperature:** 0.1 (akurasi tinggi, deterministik)

**System Prompt:**
```
Kamu adalah sistem kalkulasi zakat mal yang mengikuti fikih Islam kontemporer 
(referensi: BAZNAS RI dan fatwa MUI). Tugasmu adalah menghitung kewajiban zakat 
berdasarkan data keuangan yang diberikan dan memberikan notifikasi yang tepat.

Aturan ketat:
- Gunakan HANYA formula: Harta Wajib Zakat = Uang Tunai + Nilai Stok − Hutang Jangka Pendek
- Nishab = 85 gram emas × harga emas per gram saat ini
- Tarif zakat = 2.5% dari Harta Wajib Zakat
- Haul = 1 tahun hijriah (354 hari)
- Jika harta BELUM mencapai nishab, nyatakan dengan jelas
- Jika harta SUDAH mencapai nishab, hitung kewajiban dan tampilkan peringatan
- Format angka dalam Rupiah Indonesia (Rp X.XXX.XXX)
- Jangan beri fatwa hukum, hanya kalkulasi
```

**User Prompt Template:**
```
Data keuangan untuk kalkulasi zakat:

Uang Tunai / Saldo: Rp {{SALDO_SAAT_INI}}
Nilai Stok Barang (harga modal): Rp {{NILAI_STOK}}
Hutang Jangka Pendek: Rp {{HUTANG_JANGKA_PENDEK}}
Harga Emas Hari Ini: Rp {{HARGA_EMAS_PER_GRAM}} per gram
Tanggal Mulai Haul: {{TANGGAL_HAUL}}
Tanggal Hari Ini: {{TANGGAL_HARI_INI}}

Hitung apakah kewajiban zakat sudah terpenuhi. Sertakan:
1. Nishab dalam Rupiah
2. Harta Wajib Zakat
3. Status (Sudah/Belum mencapai nishab)
4. Jika sudah: nominal zakat yang wajib dibayar
```

**Expected Output Format (JSON):**
```json
{
  "nishab_rp": 125000000,
  "harta_wajib_zakat": 142000000,
  "status_nishab": "TERCAPAI",
  "haul_terpenuhi": true,
  "kewajiban_zakat_rp": 3550000,
  "pesan_notifikasi": "Harta Anda telah mencapai Nishab. Kewajiban Zakat Mal Anda: Rp 3.550.000",
  "catatan": "Perhitungan berdasarkan harga emas Rp 1.470.000/gram per 4 Mei 2026"
}
```

---

#### PROMPT-SYARIAH-002
**Nama:** Gharar & Zalim Flagging Engine  
**Dipanggil oleh:** F-20, F-21  
**Model Target:** claude-haiku (atau model ringan)  
**Max Tokens:** 200  
**Temperature:** 0.1

**System Prompt:**
```
Kamu adalah sistem audit kepatuhan syariah untuk transaksi marketplace.
Tugasmu adalah memeriksa apakah ada indikasi gharar (ketidakjelasan) atau 
zalim (ketidakadilan) dalam data biaya transaksi.

Definisi:
- GHARAR: Ada biaya yang tidak memiliki nilai eksplisit (null, kosong, atau "TBD")
- ZALIM: Ongkir yang dibayar pembeli lebih besar dari ongkir yang diteruskan ke kurir

Output HANYA dalam JSON. Tidak ada teks tambahan.
```

**User Prompt Template:**
```json
{
  "order_id": "{{ORDER_ID}}",
  "biaya_handling_fee": {{HANDLING_FEE}},
  "ongkir_dibayar_pembeli": {{ONGKIR_PEMBELI}},
  "ongkir_diteruskan_ke_kurir": {{ONGKIR_KURIR}},
  "admin_fee": {{ADMIN_FEE}},
  "service_fee": {{SERVICE_FEE}}
}
```

**Expected Output Format (JSON):**
```json
{
  "order_id": "...",
  "flag_gharar": false,
  "flag_zalim": false,
  "detail_gharar": null,
  "detail_zalim": null,
  "status": "COMPLIANT"
}
```

---

#### PROMPT-REPORT-001
**Nama:** Financial Report Narrative Generator  
**Dipanggil oleh:** F-32 (Export DOCX/PDF)  
**Model Target:** claude-sonnet-4-20250514  
**Max Tokens:** 1000  
**Temperature:** 0.3

**System Prompt:**
```
Kamu adalah akuntan profesional yang menulis laporan keuangan bulanan 
untuk UMKM penjual di Shopee. Gaya penulisan: formal, terstruktur, 
mudah dipahami pemilik usaha non-akuntan.

Tugas: Tulis narasi eksekutif laporan keuangan berdasarkan data yang diberikan.
Format output: teks paragraf siap masuk dokumen Word/PDF.
Bahasa: Indonesia formal.
Panjang: 3–5 paragraf (200–400 kata).
```

**User Prompt Template:**
```
Buatkan narasi eksekutif laporan keuangan untuk:

Nama Toko: {{NAMA_TOKO}}
Periode: {{PERIODE_LAPORAN}}
Omzet Kotor: Rp {{OMZET_KOTOR}}
Omzet Bersih: Rp {{OMZET_BERSIH}}
Total Beban Biaya: Rp {{BEBAN_BIAYA}}
Laba Bersih: Rp {{LABA_BERSIH}}
Margin Laba: {{MARGIN_PERSEN}}%
Jumlah Transaksi Selesai: {{JUMLAH_TRANSAKSI}}
Jumlah Return: {{JUMLAH_RETURN}} ({{RETURN_PERSEN}}%)
Produk Terlaris: {{PRODUK_TERLARIS}}
Provinsi Pembeli Terbanyak: {{PROVINSI_TERBANYAK}}
Status Zakat: {{STATUS_ZAKAT}}

Tulis narasi eksekutif yang:
1. Merangkum performa bulan ini
2. Menyoroti pencapaian dan risiko
3. Memberikan konteks pada angka-angka kunci
4. Menyebutkan status kepatuhan syariah
```

---

#### PROMPT-OCR-001
**Nama:** Shopee Screenshot Data Extractor  
**Dipanggil oleh:** OCR Integration Module  
**Model Target:** claude-sonnet-4-20250514 (vision capable)  
**Max Tokens:** 800  
**Temperature:** 0.1

*(Detail lengkap di Seksi 2 — OCR Integration Specification)*

---

### 1.3 Prompt Version Control

| Prompt ID | Versi Aktif | Tanggal Deploy | Perubahan | Status |
|---|---|---|---|---|
| PROMPT-FINANCE-001 | v1.0 | 4 Mei 2026 | Initial release | ACTIVE |
| PROMPT-SYARIAH-001 | v1.0 | 4 Mei 2026 | Initial release | ACTIVE |
| PROMPT-SYARIAH-002 | v1.0 | 4 Mei 2026 | Initial release | ACTIVE |
| PROMPT-REPORT-001 | v1.0 | 4 Mei 2026 | Initial release | ACTIVE |
| PROMPT-OCR-001 | v1.0 | 4 Mei 2026 | Initial release | ACTIVE |

**Aturan Versioning:**
- Perubahan kecil (typo, reformat) → patch version (v1.0 → v1.0.1)
- Perubahan prompt yang memengaruhi output → minor version (v1.0 → v1.1)
- Perubahan model atau arsitektur → major version (v1.0 → v2.0)
- Setiap versi baru harus melewati A/B test minimal 100 sampel sebelum deploy

---

## 2. OCR INTEGRATION SPECIFICATION

### 2.1 Gambaran Umum

Sistem menerima input gambar dari dua sumber:
1. **Screenshot aplikasi Shopee** (halaman "Pesanan Saya", "Laporan Penjualan")
2. **Foto nota/bukti pengiriman fisik**

Pipeline OCR mengubah gambar menjadi data terstruktur (JSON) yang siap dimasukkan ke database.

### 2.2 Pipeline Arsitektur OCR

```
INPUT GAMBAR
     │
     ▼
┌─────────────────────────┐
│  Pre-processing Layer   │  → Resize, denoise, deskew, enhance contrast
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Source Classifier     │  → Deteksi: Shopee App / CSV / Nota Fisik / Unknown
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Vision-LLM OCR Engine  │  → PROMPT-OCR-001 (Claude Vision / GPT-4V)
│  (Primary Extraction)   │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Schema Validator       │  → Validasi JSON output vs expected schema
└─────────────────────────┘
     │
     ├── VALID ──► JSON ke Database Parser
     │
     └── INVALID ► Manual Review Queue + Notif Admin
```

---

### 2.3 PROMPT-OCR-001 — Detail Lengkap

**System Prompt:**
```
Kamu adalah sistem OCR spesialis untuk dokumen transaksi marketplace Shopee Indonesia.
Tugasmu adalah mengekstrak data terstruktur dari gambar/screenshot yang diberikan.

Aturan ekstraksi:
- Ekstrak HANYA data yang terlihat jelas. Jika tidak jelas, isi dengan null.
- Jangan menebak atau menginterpolasi nilai yang tidak terlihat.
- Format angka: integer atau float, tanpa titik ribuan, tanpa simbol Rp.
  Contoh: "Rp 125.000" → 125000
- Format tanggal: ISO 8601 (YYYY-MM-DD)
- Status pesanan mapping:
  "Pesanan Selesai" / "Selesai" → "SELESAI"
  "Dibatalkan" / "Batal" → "DIBATALKAN"  
  "Pengembalian" / "Return" → "RETURN"
  "Dalam Pengiriman" → "DALAM_PENGIRIMAN"
- Output HANYA JSON valid. Tidak ada teks tambahan, tidak ada markdown.
```

**User Prompt Template:**
```
Ekstrak semua data transaksi dari gambar ini ke dalam format JSON berikut:

{
  "source_type": "SHOPEE_APP | SHOPEE_CSV | NOTA_FISIK",
  "extraction_confidence": 0.0-1.0,
  "tanggal_ekstraksi": "YYYY-MM-DD",
  "transaksi": [
    {
      "id_pesanan": "string | null",
      "tanggal_pesanan": "YYYY-MM-DD | null",
      "nama_produk": "string | null",
      "sku": "string | null",
      "qty": integer | null,
      "harga_satuan": float | null,
      "total_harga": float | null,
      "diskon": float | null,
      "status": "SELESAI | DIBATALKAN | RETURN | DALAM_PENGIRIMAN | null",
      "nama_pembeli": "string | null",
      "kota_pembeli": "string | null",
      "provinsi_pembeli": "string | null",
      "metode_pengiriman": "string | null",
      "ongkir_pembeli": float | null,
      "admin_fee": float | null,
      "catatan_seller": "string | null"
    }
  ],
  "field_tidak_terbaca": ["list field yang tidak bisa diekstrak"]
}

Jika gambar mengandung lebih dari 1 pesanan, isi array transaksi dengan semua pesanan.
```

---

### 2.4 Schema Validasi Output OCR

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["source_type", "extraction_confidence", "transaksi"],
  "properties": {
    "source_type": {
      "type": "string",
      "enum": ["SHOPEE_APP", "SHOPEE_CSV", "NOTA_FISIK"]
    },
    "extraction_confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "transaksi": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "id_pesanan": { "type": ["string", "null"] },
          "status": {
            "type": ["string", "null"],
            "enum": ["SELESAI", "DIBATALKAN", "RETURN", "DALAM_PENGIRIMAN", null]
          },
          "total_harga": { "type": ["number", "null"] }
        }
      }
    }
  }
}
```

**Threshold Acceptance:**
| Confidence Score | Tindakan |
|---|---|
| ≥ 0.90 | Auto-accept, langsung masuk database |
| 0.70 – 0.89 | Accept dengan flag "needs_review", tampil di dashboard review |
| < 0.70 | Reject, masuk Manual Review Queue, notif ke user |

---

### 2.5 Format Input yang Didukung

| Format | MIME Type | Ukuran Maks | Keterangan |
|---|---|---|---|
| JPG/JPEG | image/jpeg | 10 MB | Screenshot HP |
| PNG | image/png | 10 MB | Screenshot desktop |
| WebP | image/webp | 10 MB | Screenshot modern browser |
| PDF | application/pdf | 20 MB | Laporan resmi Shopee |
| CSV | text/csv | 50 MB | Export langsung dari Shopee Seller Center |

**Pre-processing Steps (sebelum kirim ke LLM):**
1. Resize gambar ke max 2048px (dimensi terpanjang) untuk efisiensi token
2. Convert ke PNG jika JPEG dengan quality < 70%
3. Auto-rotate berdasarkan EXIF metadata
4. Grayscale + contrast enhancement untuk nota fisik
5. Crop whitespace berlebih di tepi gambar

---

### 2.6 CSV Auto-Parser (Non-OCR Path)

Jika input adalah file CSV dari Shopee Seller Center, sistem menggunakan parser deterministik (tanpa LLM) untuk efisiensi:

**Mapping Kolom Shopee CSV → Database Schema:**

```python
SHOPEE_CSV_COLUMN_MAP = {
    "No. Pesanan": "id_pesanan",
    "Status Pesanan": "status",
    "Waktu Pesanan Dibuat": "tanggal_pesanan",
    "Nama Produk": "nama_produk",
    "Jumlah": "qty",
    "Harga Awal (IDR)": "harga_satuan",
    "Total Harga Produk (IDR)": "total_harga",
    "Diskon Produk dari Penjual (IDR)": "diskon",
    "Nama Penerima": "nama_pembeli",
    "Kota": "kota_pembeli",
    "Provinsi": "provinsi_pembeli",
    "Metode Pengiriman": "metode_pengiriman",
    "Ongkos Kirim Dibayar oleh Pembeli (IDR)": "ongkir_pembeli",
    "Biaya Administrasi (IDR)": "admin_fee",
    "Biaya Layanan (IDR)": "service_fee",
}

STATUS_NORMALIZATION = {
    "Pesanan Selesai": "SELESAI",
    "Dibatalkan": "DIBATALKAN",
    "Dalam Pengiriman": "DALAM_PENGIRIMAN",
    "Siap Dikirim": "SIAP_KIRIM",
    "Pengembalian Dana": "RETURN",
}
```

---

## 3. WHATSAPP BOT FLOW

### 3.1 Gambaran Umum

WhatsApp Bot berfungsi sebagai antarmuka mobile-first yang memungkinkan penjual mendapatkan ringkasan laporan, notifikasi stok, dan alert zakat langsung di WhatsApp tanpa membuka browser.

**Stack Teknis:**
- **Gateway:** Twilio for WhatsApp / WhatsApp Business API (Meta)
- **Webhook Handler:** Node.js / Python FastAPI
- **AI Backend:** Prompt Registry (Seksi 1)
- **State Management:** Redis (session per nomor WA, TTL 30 menit)

---

### 3.2 Daftar Command Bot

| Command | Alias | Deskripsi |
|---|---|---|
| `/laporan` | `/l` | Ringkasan penjualan hari ini |
| `/laporan minggu` | `/l7` | Ringkasan 7 hari terakhir |
| `/laporan bulan` | `/lb` | Ringkasan bulan berjalan |
| `/stok` | `/s` | Daftar produk dengan stok menipis |
| `/stok [nama produk]` | — | Cek stok produk spesifik |
| `/zakat` | `/z` | Status kalkulasi zakat terkini |
| `/analisis` | `/ai` | AI Feedback penjualan (PROMPT-FINANCE-001) |
| `/return` | `/r` | Ringkasan order return & alasan |
| `/upload` | `/u` | Mulai sesi upload screenshot untuk OCR |
| `/bantuan` | `/help` | Daftar semua command |

---

### 3.3 Flow Diagram Percakapan

#### Flow 1: Onboarding (Pengguna Baru)

```
USER: [Kirim pesan apa saja pertama kali]
                │
                ▼
BOT: "Halo! 👋 Saya adalah asisten laporan toko Shopee Anda.
      Untuk memulai, saya perlu verifikasi akun Anda.
      Silakan masukkan Kode Verifikasi yang tertera di dashboard web."
                │
USER: [Kirim kode verifikasi]
                │
        ┌───────┴───────┐
        ▼               ▼
    VALID           INVALID
        │               │
        ▼               ▼
BOT: "✅ Verifikasi    BOT: "❌ Kode tidak valid.
      berhasil!         Coba lagi atau kunjungi
      Ketik /bantuan    [link dashboard]"
      untuk mulai."
```

---

#### Flow 2: Laporan Harian (`/laporan`)

```
USER: /laporan
        │
        ▼
SYSTEM: Ambil data hari ini dari DB
        │
        ▼ (jika data tersedia)
SYSTEM: Panggil PROMPT-FINANCE-001 dengan data hari ini
        │
        ▼
BOT: Kirim pesan terformat:

━━━━━━━━━━━━━━━━━━━━
📊 *LAPORAN HARI INI*
🗓️ Senin, 4 Mei 2026
━━━━━━━━━━━━━━━━━━━━
💰 Omzet Kotor   : Rp 4.200.000
✅ Order Selesai : 18 pesanan
❌ Order Batal   : 2 pesanan
🔄 Return        : 1 pesanan
💵 Laba Bersih   : Rp 980.000
━━━━━━━━━━━━━━━━━━━━
🤖 *AI Insight:*
Penjualan naik 15% vs kemarin,
namun laba turun 2% karena
biaya iklan meningkat.
Saran: kurangi bid jam 00-06 WIB.
━━━━━━━━━━━━━━━━━━━━
Ketik /analisis untuk insight lengkap.
```

---

#### Flow 3: Upload OCR Screenshot (`/upload`)

```
USER: /upload
        │
        ▼
BOT: "📸 Siap menerima screenshot!
      Kirimkan gambar pesanan Shopee Anda sekarang.
      (Format: JPG, PNG, atau PDF, maks 10MB)"
        │
USER: [Kirim gambar]
        │
        ▼
SYSTEM: Validasi format & ukuran file
        │
    ┌───┴───┐
    ▼       ▼
VALID    INVALID
    │       │
    ▼       ▼
SYSTEM:  BOT: "❌ Format tidak didukung.
Pre-proses  Kirim ulang dalam format
gambar   JPG, PNG, atau PDF."
    │
    ▼
SYSTEM: Kirim ke PROMPT-OCR-001
        │
    ┌───┴────────────┐
    ▼                ▼
confidence≥0.90  confidence<0.70
    │                │
    ▼                ▼
BOT: "✅ Data         BOT: "⚠️ Gambar kurang
berhasil            jelas. Data telah
diproses!           masuk antrian review
[N] transaksi       manual. Tim kami akan
ditambahkan."       menghubungi Anda."
        │
        ▼ (confidence 0.70-0.89)
    BOT: "✅ Data diproses dengan catatan.
    Mohon cek dashboard untuk verifikasi
    [N] transaksi yang butuh konfirmasi."
```

---

#### Flow 4: Alert Otomatis (Push Notification)

Bot juga mengirim notifikasi TANPA dipicu user:

**4a. Alert Stok Habis (triggered saat stok = 0):**
```
BOT: "🔴 *STOK HABIS!*
      Produk: Lampu LED 10W
      Stok saat ini: 0 pcs
      
      Potensi kehilangan order:
      ±Rp 375.000 (estimasi 3 hari)
      
      Ketik /stok untuk lihat semua
      produk yang perlu restok."
```

**4b. Alert Zakat (triggered saat nishab tercapai):**
```
BOT: "🕌 *NOTIFIKASI ZAKAT MAL*

      Alhamdulillah, harta usaha Anda
      telah mencapai nishab zakat.
      
      Harta Wajib Zakat : Rp 142.000.000
      Nishab (85gr emas) : Rp 125.000.000
      Kewajiban Zakat   : Rp 3.550.000 (2.5%)
      
      Haul dimulai dari: 15 Jan 2026
      
      Ketik /zakat untuk detail lengkap."
```

**4c. Alert Return Tinggi (triggered saat return rate > 5%):**
```
BOT: "⚠️ *PERINGATAN RETURN TINGGI!*

      Return rate minggu ini: 7.2%
      (Threshold normal: < 5%)
      
      Produk dengan return tertinggi:
      1. Baju Kaos Polos M — 3 return
      2. Topi Rajut — 2 return
      
      Segera cek kualitas produk dan
      deskripsi listing Anda!
      
      Ketik /return untuk detail alasan."
```

---

### 3.4 Session State Schema (Redis)

```json
{
  "wa_number": "+6281234567890",
  "user_id": "USR-001",
  "toko_id": "TOKO-001",
  "session_state": "IDLE | AWAITING_OTP | AWAITING_IMAGE | AWAITING_CONFIRM",
  "last_command": "/upload",
  "last_active": "2026-05-04T08:30:00Z",
  "pending_ocr_job_id": "OCR-JOB-9182",
  "locale": "id-ID",
  "ttl_seconds": 1800
}
```

---

### 3.5 Rate Limiting Bot

| Jenis Aksi | Limit | Window |
|---|---|---|
| Command `/laporan` | 10 request | per jam |
| Command `/analisis` | 5 request | per jam |
| Upload gambar OCR | 20 gambar | per hari |
| Alert otomatis | Max 5 notif | per hari per toko |

---

## 4. INTEGRATION CONTRACTS

### 4.1 Gambaran Umum

Seksi ini mendefinisikan kontrak antar-modul sistem dalam bentuk API contract, termasuk request/response schema, auth, dan SLA.

---

### 4.2 Contract: Frontend ↔ Backend API

**Base URL:** `https://api.laporan-shopee.id/v1`  
**Auth:** Bearer Token (JWT, TTL 8 jam)  
**Format:** JSON  
**Encoding:** UTF-8

---

#### Endpoint: GET /dashboard/summary

**Deskripsi:** Ambil ringkasan dashboard utama (dipanggil setiap load halaman)

**Request:**
```http
GET /dashboard/summary?period=today&toko_id=TOKO-001
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "periode": "2026-05-04",
    "omzet_kotor": 4200000,
    "omzet_bersih": 3750000,
    "laba_bersih": 980000,
    "beban_biaya": 420000,
    "order": {
      "selesai": 18,
      "batal": 2,
      "return": 1,
      "return_rate_persen": 5.26
    },
    "stok_alert": {
      "stok_tipis": 3,
      "stok_habis": 1,
      "produk": [
        { "nama": "Lampu LED 10W", "stok": 0, "status": "HABIS" },
        { "nama": "Kaos Polos M", "stok": 3, "status": "TIPIS" }
      ]
    },
    "syariah": {
      "status_zakat": "NISHAB_TERCAPAI",
      "kewajiban_zakat": 3550000,
      "flag_gharar": false,
      "flag_zalim": false
    },
    "ai_feedback": {
      "text": "Penjualan naik 15%...",
      "generated_at": "2026-05-04T07:00:00Z",
      "prompt_version": "PROMPT-FINANCE-001-v1.0"
    },
    "status_card_color": "RED_BLINK"
  },
  "meta": {
    "generated_at": "2026-05-04T08:35:00Z",
    "cache_ttl_seconds": 60
  }
}
```

**Response 401:**
```json
{ "status": "error", "code": "AUTH_EXPIRED", "message": "Token expired" }
```

---

#### Endpoint: POST /transactions/import

**Deskripsi:** Import transaksi dari CSV atau hasil OCR

**Request:**
```http
POST /transactions/import
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "toko_id": "TOKO-001",
  "source_type": "SHOPEE_CSV | OCR_IMAGE | MANUAL",
  "file": <binary>
}
```

**Response 202 (Accepted, async processing):**
```json
{
  "status": "processing",
  "job_id": "IMPORT-JOB-8821",
  "estimated_completion_seconds": 15,
  "webhook_url": "https://api.laporan-shopee.id/v1/jobs/IMPORT-JOB-8821/status"
}
```

---

#### Endpoint: GET /reports/financial

**Deskripsi:** Ambil data laporan keuangan lengkap untuk export

**Request:**
```http
GET /reports/financial?toko_id=TOKO-001&period_start=2026-05-01&period_end=2026-05-31&format=json
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "toko_id": "TOKO-001",
    "periode": { "start": "2026-05-01", "end": "2026-05-31" },
    "laporan_keuangan": {
      "omzet_kotor": 45000000,
      "pesanan_batal_total": 2100000,
      "return_total": 1500000,
      "omzet_bersih": 41400000,
      "modal_barang": 22000000,
      "beban_biaya": {
        "admin_fee": 1200000,
        "service_fee": 800000,
        "ongkir_seller": 900000,
        "biaya_packing": 450000,
        "total": 3350000
      },
      "laba_bersih": 16050000,
      "rugi_risiko": 680000
    },
    "syariah_report": {
      "pendapatan_halal": 41400000,
      "zakat_kewajiban": 3550000,
      "status_gharar": "CLEAR",
      "status_zalim": "CLEAR"
    },
    "narrative": "Pada bulan Mei 2026, toko..."
  }
}
```

---

### 4.3 Contract: Backend ↔ AI Engine

**Protokol:** REST HTTP internal  
**Auth:** API Key (header `X-Internal-Key`)  
**Base URL:** `http://ai-service:8080/v1` (internal network)

#### Endpoint: POST /ai/generate

**Request:**
```json
{
  "prompt_id": "PROMPT-FINANCE-001",
  "prompt_version": "v1.0",
  "variables": {
    "PERIODE": "4 Mei 2026",
    "OMZET_HARI_INI": "4200000",
    "OMZET_KEMARIN": "3650000",
    "LABA_BERSIH_HARI_INI": "980000",
    "LABA_BERSIH_KEMARIN": "1000000",
    "ORDER_SELESAI": "18",
    "ORDER_BATAL": "2",
    "ORDER_RETURN": "1",
    "PRODUK_TERLARIS": "Lampu LED 10W",
    "BIAYA_ADS": "420000",
    "BIAYA_PACKING": "150000",
    "DAFTAR_STOK_TIPIS": "Lampu LED 10W (0 pcs), Kaos Polos M (3 pcs)"
  },
  "toko_id": "TOKO-001",
  "request_id": "REQ-20260504-001"
}
```

**Response 200:**
```json
{
  "status": "success",
  "request_id": "REQ-20260504-001",
  "output": "Penjualan Anda naik 15%...",
  "model_used": "claude-sonnet-4-20250514",
  "prompt_tokens": 312,
  "completion_tokens": 145,
  "latency_ms": 1240
}
```

---

### 4.4 Contract: Backend ↔ External API (Harga Emas)

**Provider:** API Harga Emas (contoh: harga-emas-api.id)  
**Auth:** API Key  
**Cache:** TTL 1 jam (data harga emas tidak perlu real-time detik-ke-detik)

#### Endpoint: GET /gold/price

**Request:**
```http
GET https://api.harga-emas.id/v1/price?currency=IDR&weight_unit=gram
X-API-Key: <api_key>
```

**Response:**
```json
{
  "date": "2026-05-04",
  "price_per_gram_idr": 1470000,
  "source": "Antam",
  "updated_at": "2026-05-04T07:00:00Z"
}
```

**Fallback jika API gagal:** Gunakan harga terakhir yang tersimpan di cache database. Tampilkan disclaimer: "Harga emas berdasarkan data [tanggal]. Koneksi ke sumber data sedang gangguan."

---

### 4.5 Contract: Backend ↔ WhatsApp Gateway

**Provider:** Twilio / Meta WhatsApp Business API  
**Protokol:** Webhook (POST dari WhatsApp ke backend), REST (backend ke WhatsApp)

#### Inbound Webhook (WhatsApp → Backend):
```json
{
  "from": "+6281234567890",
  "body": "/laporan",
  "type": "text | image | document",
  "media_url": "https://api.twilio.com/media/...",
  "timestamp": "2026-05-04T08:30:00Z",
  "message_sid": "MM1234567890"
}
```

#### Outbound Message (Backend → WhatsApp):
```json
{
  "to": "+6281234567890",
  "body": "📊 *LAPORAN HARI INI*\n...",
  "from": "whatsapp:+628XXXXXXXXXX"
}
```

---

### 4.6 Contract: Backend ↔ Export Engine (DOCX / PDF / XLSX)

**Protokol:** Internal job queue (Redis Queue / Celery)

#### Job Schema (Export Request):
```json
{
  "job_type": "EXPORT",
  "job_id": "EXPORT-JOB-5512",
  "toko_id": "TOKO-001",
  "format": "DOCX | PDF | XLSX",
  "report_type": "FINANCIAL_MONTHLY | TRANSACTION_DETAIL | ZAKAT_REPORT",
  "period": { "start": "2026-05-01", "end": "2026-05-31" },
  "include_narrative": true,
  "requested_by": "USR-001",
  "callback_url": "https://api.laporan-shopee.id/v1/jobs/EXPORT-JOB-5512/complete"
}
```

#### Job Completion Callback:
```json
{
  "job_id": "EXPORT-JOB-5512",
  "status": "COMPLETED | FAILED",
  "download_url": "https://cdn.laporan-shopee.id/exports/TOKO-001/laporan-mei-2026.docx",
  "expires_at": "2026-05-11T08:00:00Z",
  "file_size_bytes": 124800
}
```

---

## 5. ERROR HANDLING & FALLBACK STRATEGY

### 5.1 Matriks Error

| Komponen | Error | Fallback | User-Facing Message |
|---|---|---|---|
| AI Engine timeout (>10s) | PROMPT-FINANCE-001 gagal | Tampilkan data angka saja, skip narasi AI | "AI Insight sedang tidak tersedia. Data angka tetap akurat." |
| OCR confidence < 0.70 | Gambar tidak terbaca | Masuk Manual Review Queue | "Gambar kurang jelas, akan diproses manual." |
| Harga emas API down | Zakat tidak bisa dihitung | Pakai cache terakhir + disclaimer | "Menggunakan harga emas terakhir: [tanggal]" |
| WA Gateway timeout | Pesan gagal terkirim | Retry 3x dengan backoff 5s, 30s, 2m | — (tidak ada pesan ke user) |
| Database timeout | Dashboard gagal load | Serve dari cache Redis (TTL 5 menit) | "Data mungkin tidak real-time, refresh untuk terbaru." |
| CSV parsing error | Kolom tidak dikenal | Log error + notif admin | "Format CSV tidak dikenali. Gunakan template resmi Shopee." |

---

### 5.2 Circuit Breaker

Gunakan pola Circuit Breaker untuk pemanggilan AI Engine dan External API:

```
CLOSED (Normal) → [5 error dalam 60 detik] → OPEN (Fallback mode)
OPEN → [setelah 30 detik] → HALF-OPEN (Coba 1 request)
HALF-OPEN → [sukses] → CLOSED
HALF-OPEN → [gagal] → OPEN kembali
```

---

## 6. SECURITY & COMPLIANCE NOTES

### 6.1 Data Sensitif dalam Prompt

**DILARANG** memasukkan data berikut ke dalam prompt AI:
- Nama lengkap pembeli yang bisa diidentifikasi
- Nomor telepon atau alamat email
- Nomor rekening bank
- Data yang tidak relevan dengan kalkulasi

**WAJIB** dilakukan sebelum kirim ke AI:
- Masking nama pembeli: "Ahmad Hidayat" → "AH***"
- Masking nomor pesanan jika sensitif
- Hanya kirim agregat data, bukan data per-individu kecuali diperlukan

### 6.2 Prompt Injection Prevention

- Semua variabel template `{{VAR}}` harus di-escape sebelum dimasukkan
- Input dari user (nama produk, catatan, dll.) harus di-sanitize:
  - Strip karakter: `\n`, `\r`, `"`, `'`, backtick
  - Maksimal panjang per field: 200 karakter
- Selalu validasi output AI terhadap schema sebelum ditampilkan ke user

### 6.3 Audit Log

Setiap pemanggilan prompt AI harus dicatat:
```json
{
  "timestamp": "2026-05-04T08:35:00Z",
  "prompt_id": "PROMPT-FINANCE-001",
  "prompt_version": "v1.0",
  "toko_id": "TOKO-001",
  "request_id": "REQ-20260504-001",
  "latency_ms": 1240,
  "token_count": 457,
  "status": "SUCCESS",
  "model": "claude-sonnet-4-20250514"
}
```

Log disimpan minimal 90 hari untuk keperluan audit dan debugging.

---

## LAMPIRAN: Glosarium

| Istilah | Definisi |
|---|---|
| **Nishab** | Batas minimum harta yang wajib dizakati (setara 85 gram emas) |
| **Haul** | Masa kepemilikan harta selama 1 tahun hijriah (syarat zakat) |
| **Gharar** | Ketidakjelasan/ambiguitas dalam transaksi (dilarang dalam fiqih) |
| **Zalim** | Ketidakadilan dalam transaksi, merugikan salah satu pihak |
| **OCR** | Optical Character Recognition — teknologi baca teks dari gambar |
| **Circuit Breaker** | Pola arsitektur untuk mencegah cascade failure |
| **TTL** | Time-To-Live — durasi data valid di cache |
| **JWT** | JSON Web Token — format token autentikasi |
| **SKU** | Stock Keeping Unit — kode unik identifikasi produk |

---

## RIWAYAT DOKUMEN

| Versi | Tanggal | Penulis | Perubahan |
|---|---|---|---|
| 1.0 | 4 Mei 2026 | AI Engineer | Dokumen awal berdasarkan PRD v1.0 |

---

*Dokumen ini adalah spesifikasi teknis internal. Distribusi terbatas untuk Tim Developer, AI Engineer, dan Tech Lead.*
