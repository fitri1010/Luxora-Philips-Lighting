# BUSINESS_RULES.md
## Dokumen Aturan Bisnis Sistem
### Aplikasi Laporan Penjualan Shopee

---

**Versi Dokumen:** 1.0
**Tanggal:** 4 Mei 2026
**Penulis:** Product Owner · Tech Lead
**Referensi:** PRD v1.0 (Safitri Haryanti) · AI_SPEC.md v1.0 · DEV_GUIDE.md v1.0
**Audience:** Developer · Product Owner · QA Engineer · Business Analyst
**Status:** Draft untuk Review

---

> 📌 **Cara Membaca Dokumen Ini**
> Setiap aturan bisnis dikodekan dengan format **BR-[DOMAIN]-[NOMOR]**.
> Kode ini direferensikan di kode aplikasi, test case, dan tiket development.
> Perubahan aturan bisnis HARUS melalui approval Product Owner dan Tech Lead.

---

## DAFTAR ISI

1. [Definisi & Glosarium](#1-definisi--glosarium)
2. [Role & Hak Akses](#2-role--hak-akses)
3. [Approval Workflow](#3-approval-workflow)
4. [Aturan Transaksi & Threshold](#4-aturan-transaksi--threshold)
5. [Alur Program Utama](#5-alur-program-utama)
6. [Alur Syariah & Zakat](#6-alur-syariah--zakat)
7. [Alur Verifikasi Masjid / Lembaga Penerima Zakat](#7-alur-verifikasi-masjid--lembaga-penerima-zakat)
8. [Aturan Stok & Inventori](#8-aturan-stok--inventori)
9. [Aturan Export & Pelaporan](#9-aturan-export--pelaporan)
10. [Aturan Notifikasi WhatsApp Bot](#10-aturan-notifikasi-whatsapp-bot)
11. [Matriks Keputusan & Edge Cases](#11-matriks-keputusan--edge-cases)
12. [Riwayat Perubahan Aturan](#12-riwayat-perubahan-aturan)

---

## 1. DEFINISI & GLOSARIUM

Definisi berikut berlaku di seluruh sistem, kode, dan dokumentasi.
Gunakan istilah ini secara konsisten — jangan parafrase dalam kode.

| Istilah | Definisi Teknis | Catatan |
|---|---|---|
| **Toko** | Entitas bisnis milik satu OWNER, unit isolasi data tertinggi | Satu akun bisa punya satu toko di v1.0 |
| **Omzet Kotor** | `SUM(total_harga)` semua pesanan yang masuk, tanpa filter status | Termasuk pesanan yang akhirnya batal/return |
| **Omzet Bersih** | `Omzet Kotor − Total Batal − Total Return` | Tidak sama dengan Pendapatan Halal |
| **Pendapatan Halal** | `SUM(total_harga)` hanya pesanan berstatus `SELESAI` | Dipakai untuk kalkulasi syariah |
| **Beban Biaya** | `Admin Fee + Service Fee + Ongkir Seller + Biaya Packing` | Semua biaya yang mengurangi margin |
| **Laba Bersih** | `Omzet Bersih − Modal Barang − Beban Biaya` | Basis kalkulasi zakat |
| **Rugi Risiko** | Biaya packing + ongkir yang sudah dikeluarkan untuk pesanan yang return | Kerugian nyata yang tidak bisa kembali |
| **Harta Wajib Zakat** | `Saldo + Nilai Stok − Hutang Jangka Pendek` | Sesuai PROMPT-SYARIAH-001 |
| **Nishab** | `85 gram × harga emas hari ini (IDR/gram)` | Threshold wajib zakat |
| **Haul** | Masa kepemilikan harta ≥ 354 hari (1 tahun hijriah) | Syarat wajib zakat selain nishab |
| **Gharar** | Kondisi biaya tidak memiliki nilai eksplisit (null/kosong/TBD) | Melanggar prinsip syariah |
| **Zalim** | Ongkir yang dibayar pembeli > ongkir yang diteruskan ke kurir | Melanggar prinsip syariah |
| **Return Rate** | `(Jumlah Return / Total Order Selesai) × 100%` | Bukan dibagi total order masuk |
| **Stok Tipis** | Stok di bawah ambang minimum yang dikonfigurasi | Default: 5 pcs |
| **Confidence Score** | Skor akurasi OCR (0.0–1.0) | ≥0.90 auto-accept, <0.70 reject |
| **Lembaga Penerima Zakat** | Masjid atau LAZ resmi yang sudah melalui verifikasi sistem | Lihat Seksi 7 |

---

## 2. ROLE & HAK AKSES

### 2.1 Hierarki Role

```
SUPER_ADMIN (Platform Level)
    │
    └── OWNER (Toko Level)
            │
            ├── ACCOUNTANT (Read-only keuangan)
            └── STAFF (Operasional harian)
```

### 2.2 Definisi Role & Permission Matrix

#### BR-ROLE-001: OWNER

**Definisi:** Pemilik toko yang mendaftarkan akun. Satu toko memiliki tepat satu OWNER.
Tidak bisa ada toko tanpa OWNER.

| Domain | Aksi | Diizinkan? | Catatan |
|---|---|---|---|
| Dashboard | Lihat ringkasan | ✅ | Data tokonya sendiri |
| Transaksi | Lihat detail | ✅ | |
| Transaksi | Import CSV / OCR | ✅ | |
| Transaksi | Hapus transaksi | ✅ | Hanya transaksi ≤ 24 jam, lihat BR-TRX-007 |
| Laporan | Lihat & export | ✅ | DOCX, PDF, XLSX |
| Stok | Baca & tulis | ✅ | |
| Syariah | Lihat kalkulasi | ✅ | |
| Zakat | Konfirmasi bayar | ✅ | Lihat Seksi 6 |
| Pengaturan | Ubah profil toko | ✅ | |
| Pengaturan | Undang staff | ✅ | Maks. 5 staff per toko di v1.0 |
| WhatsApp | Kelola bot | ✅ | |
| Data toko lain | Akses apapun | ❌ | Hard block, audit dicatat |

#### BR-ROLE-002: STAFF

**Definisi:** Karyawan yang diundang OWNER. Akses terbatas pada operasional harian.
Tidak bisa melihat data keuangan sensitif (laba, zakat).

| Domain | Aksi | Diizinkan? | Catatan |
|---|---|---|---|
| Dashboard | Lihat ringkasan | ✅ | Omzet tersembunyi, hanya order count |
| Transaksi | Lihat daftar | ✅ | |
| Transaksi | Import CSV / OCR | ✅ | |
| Transaksi | Hapus transaksi | ❌ | Hanya OWNER |
| Laporan | Lihat | ❌ | Tidak ada akses laporan keuangan |
| Laporan | Export | ❌ | |
| Stok | Baca | ✅ | |
| Stok | Update stok masuk | ✅ | |
| Syariah / Zakat | Semua | ❌ | |
| Pengaturan | Lihat | ✅ | |
| Pengaturan | Ubah | ❌ | Hanya OWNER |

#### BR-ROLE-003: ACCOUNTANT

**Definisi:** Pengelola keuangan yang diundang OWNER. Read-only untuk seluruh data keuangan.
Tidak bisa mengubah data apapun.

| Domain | Aksi | Diizinkan? | Catatan |
|---|---|---|---|
| Dashboard | Lihat ringkasan penuh | ✅ | Termasuk laba & biaya |
| Transaksi | Lihat detail | ✅ | |
| Transaksi | Import / Hapus | ❌ | Read-only |
| Laporan | Lihat & export | ✅ | Untuk keperluan audit |
| Stok | Baca | ✅ | |
| Stok | Update | ❌ | |
| Syariah / Zakat | Lihat | ✅ | Termasuk history zakat |
| Zakat | Konfirmasi bayar | ❌ | Hanya OWNER |
| Pengaturan | Semua | ❌ | |

#### BR-ROLE-004: SUPER_ADMIN

**Definisi:** Admin platform internal Aplikasi Laporan Shopee. Bukan penjual.
Akses lintas toko hanya untuk support & investigasi. Setiap aksi WAJIB diaudit.

**Pembatasan tambahan:**
- **BR-ROLE-004a:** SUPER_ADMIN hanya bisa login dari IP yang masuk whitelist (kantor + VPN)
- **BR-ROLE-004b:** MFA wajib diaktifkan sebelum bisa menggunakan akun SUPER_ADMIN
- **BR-ROLE-004c:** Setiap akses ke data toko oleh SUPER_ADMIN menghasilkan audit log dengan reason wajib diisi
- **BR-ROLE-004d:** SUPER_ADMIN tidak bisa export laporan keuangan toko tanpa approval dari Tech Lead (lihat BR-APV-003)
- **BR-ROLE-004e:** Session SUPER_ADMIN TTL maksimal 1 jam, tidak ada refresh token

### 2.3 Aturan Manajemen Role

| ID | Aturan | Pelaksana |
|---|---|---|
| **BR-ROLE-010** | Hanya OWNER yang bisa mengundang STAFF dan ACCOUNTANT | Sistem enforce |
| **BR-ROLE-011** | OWNER tidak bisa mengundang OWNER lain di toko yang sama | Sistem enforce |
| **BR-ROLE-012** | Satu email hanya bisa memiliki satu role per toko | Sistem enforce |
| **BR-ROLE-013** | Jumlah STAFF maksimal 5 per toko (v1.0). ACCOUNTANT maksimal 2 | Sistem enforce |
| **BR-ROLE-014** | OWNER bisa mencabut akses STAFF/ACCOUNTANT kapan saja, efektif instan | Sistem enforce |
| **BR-ROLE-015** | Jika OWNER menghapus akun, semua data toko masuk status `FROZEN` selama 30 hari sebelum dihapus permanen | Manual oleh SUPER_ADMIN |
| **BR-ROLE-016** | Undangan role via email expired dalam 48 jam jika tidak diterima | Sistem enforce |

---

## 3. APPROVAL WORKFLOW

### 3.1 Peta Approval — Kapan Diperlukan?

Tidak semua aksi memerlukan approval. Tabel berikut mendefinisikan aksi mana yang
langsung (`AUTO`) dan mana yang perlu persetujuan (`APPROVAL`).

| Aksi | Role Pemohon | Approver | Mode | SLA |
|---|---|---|---|---|
| Import transaksi CSV < 500 baris | OWNER / STAFF | — | AUTO | Seketika |
| Import transaksi CSV ≥ 500 baris | OWNER / STAFF | — | AUTO + notif | < 5 menit |
| Import OCR confidence ≥ 0.90 | OWNER / STAFF | — | AUTO | < 30 detik |
| Import OCR confidence 0.70–0.89 | OWNER / STAFF | OWNER | APPROVAL | 24 jam |
| Import OCR confidence < 0.70 | OWNER / STAFF | OWNER | REVIEW MANUAL | 48 jam |
| Hapus transaksi | OWNER | — | AUTO (≤ 24 jam) | Seketika |
| Hapus transaksi | OWNER | SUPER_ADMIN | APPROVAL (> 24 jam) | 2 hari kerja |
| Export laporan oleh ACCOUNTANT | ACCOUNTANT | — | AUTO | < 60 detik |
| Akses data toko oleh SUPER_ADMIN | SUPER_ADMIN | Tech Lead | APPROVAL | 1 hari kerja |
| Konfirmasi zakat terbayar | OWNER | — | AUTO | Seketika |
| Daftarkan lembaga penerima zakat | OWNER | SUPER_ADMIN | APPROVAL | 3 hari kerja |
| Ubah nishab manual (override) | SUPER_ADMIN | Tech Lead | APPROVAL | 1 hari kerja |
| Reset password toko | OWNER | — | AUTO + verif email | < 5 menit |
| Hapus akun toko permanen | OWNER | SUPER_ADMIN | APPROVAL | 5 hari kerja |

### 3.2 Approval Workflow Detail

#### BR-APV-001: Approval OCR Confidence 0.70–0.89

```
TRIGGER: Sistem mendeteksi confidence score OCR antara 0.70 dan 0.89

STEP 1 — Sistem:
  • Simpan data OCR ke tabel ocr_pending_reviews
  • Tandai field yang ragu-ragu dengan flag `low_confidence: true`
  • Kirim notifikasi ke OWNER via WhatsApp dan email:
    "Ada 3 transaksi dari foto yang perlu dikonfirmasi. Cek di dashboard."

STEP 2 — OWNER (dalam 24 jam):
  • Buka halaman Review OCR di dashboard
  • Untuk setiap transaksi yang ter-flag:
    OPSI A: "Konfirmasi Benar" → data masuk database dengan status VERIFIED_OCR
    OPSI B: "Edit & Konfirmasi" → OWNER edit field yang salah, lalu konfirmasi
    OPSI C: "Tolak" → data dibuang, tidak masuk database

STEP 3 — Jika OWNER tidak merespons dalam 24 jam:
  • Kirim reminder notifikasi (sekali)
  • Jika dalam 48 jam total tidak ada respons:
    → Data dibuang otomatis
    → OWNER dinotifikasi: "Data foto [tanggal] otomatis ditolak karena tidak dikonfirmasi"

BUSINESS RULE:
  BR-APV-001a: Transaksi dengan confidence 0.70–0.89 TIDAK BOLEH masuk laporan keuangan
               sebelum dikonfirmasi OWNER
  BR-APV-001b: Data yang ditolak/dibuang tidak bisa dipulihkan
  BR-APV-001c: OWNER bisa minta ulang OCR dengan foto yang lebih jelas
```

#### BR-APV-002: Approval Hapus Transaksi > 24 Jam

```
TRIGGER: OWNER mencoba hapus transaksi yang dibuat lebih dari 24 jam lalu

STEP 1 — OWNER mengajukan permintaan penghapusan:
  • Mengisi alasan (wajib, minimal 20 karakter)
  • Konfirmasi dengan mengetik ulang ID pesanan
  • Sistem membuat tiket: deletion_requests

STEP 2 — SUPER_ADMIN menerima notifikasi:
  • Review tiket dalam 2 hari kerja
  • Cek audit log transaksi yang bersangkutan
  • OPSI A: Setujui → transaksi dihapus, laporan keuangan direcalculate
  • OPSI B: Tolak dengan alasan → OWNER dinotifikasi

STEP 3 — Setelah keputusan:
  • Jika disetujui: audit log mencatat siapa yang approve, kapan, alasan
  • Data transaksi dipindah ke tabel deleted_transactions (soft delete, 90 hari)
  • Laporan keuangan periode terkait diregenerasi otomatis

BUSINESS RULE:
  BR-APV-002a: Hapus transaksi yang sudah masuk laporan bulanan yang ter-export TIDAK bisa
               dilakukan — hanya bisa koreksi via jurnal penyesuaian
  BR-APV-002b: SUPER_ADMIN tidak bisa hapus transaksi tanpa persetujuan Tech Lead jika
               nilai transaksi > Rp 10.000.000
```

#### BR-APV-003: Akses Data Toko oleh SUPER_ADMIN

```
TRIGGER: SUPER_ADMIN perlu mengakses data toko spesifik untuk keperluan support

STEP 1 — SUPER_ADMIN mengajukan access request:
  • Pilih toko_id yang akan diakses
  • Isi alasan akses (wajib, minimal 50 karakter)
  • Pilih durasi akses: 1 jam / 4 jam / 1 hari

STEP 2 — Tech Lead menerima notifikasi:
  • Approve atau tolak dalam 1 hari kerja
  • Jika urgent (SEV-1/2): bisa approve via WA/Slack dengan konfirmasi tertulis

STEP 3 — Jika disetujui:
  • SUPER_ADMIN mendapat akses sementara dengan scope terbatas
  • Setiap halaman yang dikunjungi tercatat di access_logs
  • Akses otomatis dicabut setelah durasi habis

STEP 4 — Notifikasi ke OWNER toko:
  • OWNER toko dinotifikasi: "Tim support mengakses data toko Anda pada [waktu] untuk
    keperluan [alasan umum]. Akses berakhir pada [waktu]."
  • OWNER TIDAK bisa menolak akses support yang sudah diapprove (ini tercantum di ToS)
  • Tapi OWNER bisa mengajukan komplain ke tim legal

BUSINESS RULE:
  BR-APV-003a: Tidak ada access request SUPER_ADMIN yang bisa disetujui sendiri (4-eyes principle)
  BR-APV-003b: Export laporan dari akses SUPER_ADMIN DILARANG tanpa approval eksplisit Tech Lead
  BR-APV-003c: Log akses SUPER_ADMIN ke data toko disimpan permanen (tidak bisa dihapus)
```

### 3.3 Status Lifecycle Approval Request

```
                    ┌─────────────┐
                    │   PENDING   │ ← State awal setelah request dibuat
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ APPROVED │ │ REJECTED │ │ EXPIRED  │
        └──────────┘ └──────────┘ └──────────┘
              │
              ▼
        ┌──────────┐
        │ EXECUTED │ ← Aksi nyata sudah dilakukan berdasarkan approval
        └──────────┘
```

---

## 4. ATURAN TRANSAKSI & THRESHOLD

### 4.1 Status Transaksi

#### BR-TRX-001: Status yang Valid

Sistem hanya mengenal 4 status transaksi. Tidak ada status lain.

```
SELESAI         → Pesanan selesai, barang diterima pembeli, uang cair ke penjual
DIBATALKAN      → Pesanan batal sebelum pengiriman (oleh penjual, pembeli, atau sistem)
RETURN          → Barang sudah dikirim, tapi dikembalikan oleh pembeli
DALAM_PENGIRIMAN → Pesanan sedang dalam proses kirim (transisi, belum final)
```

#### BR-TRX-002: Aturan Transisi Status

Status bergerak satu arah. Tidak ada rollback status kecuali melalui approval.

```
DALAM_PENGIRIMAN  →  SELESAI       ✅ Normal
DALAM_PENGIRIMAN  →  RETURN        ✅ Barang ditolak saat pengiriman
DALAM_PENGIRIMAN  →  DIBATALKAN    ✅ Dibatalkan setelah dikirim (jarang)
SELESAI           →  RETURN        ✅ Return setelah selesai (klaim garansi, dll.)
SELESAI           →  DIBATALKAN    ❌ TIDAK DIIZINKAN
DIBATALKAN        →  [apapun]      ❌ TIDAK DIIZINKAN (status final)
RETURN            →  [apapun]      ❌ TIDAK DIIZINKAN (status final)
```

> **BR-TRX-002a:** Jika data dari Shopee CSV menunjukkan status yang tidak valid dalam
> urutan di atas, sistem memflag transaksi sebagai `NEEDS_REVIEW` dan tidak memprosesnya
> otomatis ke laporan keuangan.

#### BR-TRX-003: Dampak Status ke Laporan Keuangan

| Status | Masuk Omzet Kotor? | Masuk Omzet Bersih? | Masuk Pendapatan Halal? | Kurangi Stok? |
|---|---|---|---|---|
| `SELESAI` | ✅ | ✅ | ✅ | ✅ |
| `DIBATALKAN` | ✅ | ❌ | ❌ | ❌ |
| `RETURN` | ✅ | ❌ | ❌ | ❌ (stok kembali, lihat BR-STK-003) |
| `DALAM_PENGIRIMAN` | ✅ | ❌ | ❌ | ✅ (sudah keluar gudang) |

#### BR-TRX-004: Validasi Field Wajib Transaksi

Transaksi yang tidak memenuhi semua field wajib berikut TIDAK boleh diproses:

| Field | Tipe | Wajib? | Validasi |
|---|---|---|---|
| `id_pesanan` | String | ✅ | Unik per toko, tidak boleh duplikat |
| `tanggal_pesanan` | Date | ✅ | Tidak boleh lebih dari hari ini |
| `nama_produk` | String | ✅ | Min 2 karakter, maks 200 karakter |
| `qty` | Integer | ✅ | ≥ 1, ≤ 9999 |
| `harga_satuan` | Decimal | ✅ | > 0, dalam IDR |
| `total_harga` | Decimal | ✅ | Harus = `harga_satuan × qty − diskon` ± Rp 10 (toleransi pembulatan) |
| `status` | Enum | ✅ | Harus salah satu dari 4 status valid |
| `diskon` | Decimal | ❌ | ≥ 0, tidak boleh > `total_harga` |

#### BR-TRX-005: Deteksi Duplikasi

```
Sistem menganggap dua transaksi duplikat jika memiliki kombinasi sama:
  (toko_id + id_pesanan)

Jika duplikat terdeteksi saat import:
  OPSI A: Data dari CSV/OCR baru DIABAIKAN, data lama dipertahankan
  OPSI B: Sistem flag sebagai DUPLICATE dan tampilkan di review queue

Aturan berlaku untuk import CSV maupun OCR upload.
Duplikat TIDAK boleh masuk laporan keuangan dua kali.
```

#### BR-TRX-006: Threshold Nilai Transaksi

| Kondisi | Nilai | Aksi Sistem |
|---|---|---|
| Transaksi sangat besar | > Rp 50.000.000 per order | Flag `HIGH_VALUE`, notif OWNER via WA + email |
| Transaksi nol | Rp 0 | Reject, tidak bisa diimport |
| Diskon melebihi harga | Diskon > total_harga | Reject, tampilkan error |
| Nilai negatif | total_harga < 0 | Reject, tampilkan error |
| Transaksi masa depan | tanggal_pesanan > hari ini | Reject, tidak bisa diimport |
| Transaksi terlalu lama | tanggal_pesanan > 2 tahun lalu | Warning, perlu konfirmasi OWNER |

#### BR-TRX-007: Aturan Penghapusan Transaksi

```
Transaksi BISA dihapus langsung oleh OWNER jika:
  • Dibuat ≤ 24 jam yang lalu, DAN
  • Belum masuk dalam laporan yang sudah di-export, DAN
  • Berstatus DALAM_PENGIRIMAN atau DIBATALKAN

Transaksi MEMERLUKAN APPROVAL jika:
  • Dibuat > 24 jam yang lalu, ATAU
  • Berstatus SELESAI atau RETURN

Transaksi TIDAK BISA dihapus jika:
  • Sudah masuk laporan bulanan yang ter-export dan didistribusikan
  • Solusi: buat jurnal koreksi manual
```

### 4.2 Aturan Kalkulasi Biaya

#### BR-COST-001: Komponen Beban Biaya

Sistem menghitung Beban Biaya dari 4 komponen berikut.
Semua komponen HARUS memiliki nilai eksplisit (tidak boleh null) — ini syarat bebas gharar.

```
Beban Biaya = Admin Fee + Service Fee + Ongkir Seller + Biaya Packing

Dimana:
  Admin Fee    = Biaya administrasi yang dipotong Shopee per transaksi
  Service Fee  = Biaya layanan platform Shopee
  Ongkir Seller= Biaya pengiriman yang ditanggung penjual (bukan subsidi Shopee)
  Biaya Packing= Kardus + bubble wrap + isolasi (input manual oleh penjual)
```

#### BR-COST-002: Validasi Bebas Gharar

```
RULE: Setiap transaksi yang masuk laporan harus memiliki semua komponen biaya
      dengan nilai yang jelas dan eksplisit.

Sistem MENOLAK memasukkan transaksi ke laporan syariah jika:
  • Admin Fee = null atau tidak ada dalam data
  • Service Fee = null atau tidak ada dalam data

Sistem menampilkan WARNING (tidak menolak) jika:
  • Biaya Packing = 0 (mungkin memang tidak ada biaya packing)
  • Ongkir Seller = 0 (mungkin ditanggung sepenuhnya oleh Shopee/subsidi)

Semua warning harus dikonfirmasi OWNER sebelum laporan syariah digenerate.
```

#### BR-COST-003: Validasi Bebas Zalim (Ongkir)

```
RULE: Ongkir yang dibayar pembeli TIDAK BOLEH lebih dari ongkir yang diteruskan ke kurir.

Sistem flagging ZALIM jika:
  ongkir_dibayar_pembeli > ongkir_diteruskan_ke_kurir

Sistem CLEAR (tidak ada zalim) jika:
  ongkir_dibayar_pembeli ≤ ongkir_diteruskan_ke_kurir
  (Selisih positif = subsidi dari penjual, ini diizinkan)

Jika terdeteksi zalim:
  1. Transaksi ditandai flag ZALIM di database
  2. Tidak masuk laporan cash flow syariah
  3. OWNER dinotifikasi dengan detail selisihnya
  4. OWNER harus mengkonfirmasi: "Sudah dikembalikan ke pembeli" atau "Belum dikembalikan"
```

#### BR-COST-004: Formula Rugi Risiko

```
Rugi Risiko dihitung hanya untuk transaksi berstatus RETURN:

Rugi Risiko per Transaksi = Ongkir Seller + Biaya Packing

(karena biaya ini sudah dikeluarkan dan tidak bisa dikembalikan meski barang kembali)

Total Rugi Risiko Periode = SUM(Rugi Risiko) semua transaksi RETURN dalam periode
```

---

## 5. ALUR PROGRAM UTAMA

### 5.1 Alur Import Data Transaksi

```
INPUT
  │
  ├─── CSV dari Shopee Seller Center
  │         └── Parser deterministik (mapping kolom, lihat AI_SPEC.md Seksi 2.6)
  │
  ├─── Screenshot/Foto Shopee App
  │         └── OCR via Vision-LLM (PROMPT-OCR-001)
  │
  └─── Input Manual (form di dashboard)
            └── Validasi form real-time

                    │
                    ▼
        ┌───────────────────────┐
        │   VALIDATION LAYER    │
        │                       │
        │ • Cek field wajib     │
        │ • Cek tipe data       │
        │ • Cek duplikasi       │
        │ • Cek threshold nilai │
        │ • Cek status valid    │
        └──────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    VALID                INVALID
         │                   │
         │              Tampilkan error
         │              per baris/field
         ▼
┌────────────────────┐
│  CONFIDENCE CHECK  │ (khusus OCR)
│  (hanya OCR path)  │
└────────┬───────────┘
         │
    ┌────┴──────────────────┐
    ▼           ▼           ▼
 ≥ 0.90    0.70–0.89    < 0.70
    │           │           │
  AUTO       OWNER       REJECT &
  IMPORT    REVIEW       NOTIF USER
    │       QUEUE
    │           │
    │    (lihat BR-APV-001)
    │           │
    └─────┬─────┘
          ▼
┌─────────────────────────────────────┐
│         DATABASE WRITE              │
│                                     │
│ • transactions                      │
│ • transaction_costs                 │
│ • stock_movements (jika SELESAI)    │
│ • geographic_buyers                 │
│ • cancellation_reasons (jika batal) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      REALTIME RECALCULATION         │
│                                     │
│ • Omzet Kotor / Bersih              │
│ • Beban Biaya                       │
│ • Laba Bersih                       │
│ • Return Rate                       │
│ • Harta Wajib Zakat (update)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         ALERT CHECK                 │
│                                     │
│ • Stok habis? → Alert merah        │
│ • Stok tipis? → Alert kuning       │
│ • Return rate > 5%? → Kartu merah │
│ • Nishab tercapai? → Alert zakat  │
│ • Nilai HIGH_VALUE? → Notif OWNER  │
└─────────────────────────────────────┘
```

### 5.2 Alur Generate Laporan Keuangan

```
TRIGGER: OWNER atau ACCOUNTANT klik "Generate Laporan"

STEP 1 — Parameter Input:
  • Periode: tanggal mulai → tanggal akhir
  • Format: DOCX / PDF / XLSX
  • Include narrative AI: Ya / Tidak
  • Include kalkulasi zakat: Ya / Tidak

STEP 2 — Data Aggregation:
  Query database dengan filter:
    • toko_id = current_user.toko_id (WAJIB, tidak bisa diubah user)
    • created_at BETWEEN start_date AND end_date
    • is_deleted = false

STEP 3 — Formula Execution (urutan wajib):
  1. Omzet Kotor     ← SUM semua transaksi dalam periode
  2. Omzet Bersih    ← Omzet Kotor − SUM(DIBATALKAN) − SUM(RETURN)
  3. Beban Biaya     ← SUM(admin_fee + service_fee + ongkir + packing) transaksi SELESAI
  4. Modal Barang    ← SUM(harga_modal × qty) transaksi SELESAI
  5. Laba Bersih     ← Omzet Bersih − Modal Barang − Beban Biaya
  6. Rugi Risiko     ← SUM(ongkir + packing) transaksi RETURN
  7. Return Rate     ← (COUNT RETURN / COUNT SELESAI) × 100%

STEP 4 — Syariah Compliance Check (jika diminta):
  • Cek gharar: ada transaksi dengan biaya null?
  • Cek zalim: ada ongkir pembeli > ongkir kurir?
  • Kalkulasi zakat: jalankan PROMPT-SYARIAH-001
  • Jika ada flag → sertakan dalam laporan sebagai catatan

STEP 5 — AI Narrative Generation (jika diminta):
  • Panggil PROMPT-REPORT-001 dengan data agregat
  • Waktu timeout: 15 detik
  • Jika timeout: lanjutkan tanpa narasi, tampilkan notifikasi

STEP 6 — File Generation:
  • DOCX: ringkasan + narasi + tabel biaya (siap sunting)
  • PDF:  same as DOCX, non-editable, dengan watermark "DRAFT"
  • XLSX: data mentah semua transaksi + sheet ringkasan

STEP 7 — Delivery:
  • File tersedia di dashboard selama 7 hari
  • Download link di-email ke OWNER/ACCOUNTANT
  • Pre-signed URL dengan TTL 24 jam untuk keamanan

BUSINESS RULES:
  BR-RPT-001: Laporan hanya bisa digenerate jika periode memiliki minimal 1 transaksi SELESAI
  BR-RPT-002: Laporan dengan periode > 1 tahun DILARANG di v1.0 (batas performa)
  BR-RPT-003: File XLSX tidak mengandung data PII pembeli — hanya ID pesanan dan kota (bukan nama)
  BR-RPT-004: Narasi AI tidak digenerate untuk periode tanpa transaksi SELESAI
  BR-RPT-005: Laporan yang sudah di-download tidak bisa ditarik kembali
```

### 5.3 Alur Update Stok Real-Time

```
EVENT TRIGGER → DATABASE WRITE → STOCK RECALCULATION → ALERT CHECK

Detail per event:

EVENT: Pesanan masuk (status: DALAM_PENGIRIMAN)
  → Kurangi stok produk sebesar qty
  → Jika stok_baru < stok_minimum → trigger alert TIPIS
  → Jika stok_baru = 0 → trigger alert HABIS

EVENT: Pesanan selesai (status: SELESAI)
  → Tidak ada perubahan stok (sudah dikurangi saat DALAM_PENGIRIMAN)

EVENT: Pesanan batal (status: DIBATALKAN)
  → Kembalikan stok sebesar qty (batalkan pengurangan)
  → Update alert jika sebelumnya TIPIS/HABIS

EVENT: Pesanan return (status: RETURN)
  → Masukkan ke antrian inspeksi return
  → OWNER konfirmasi: "Layak jual?" atau "Tidak layak jual"
  → Jika LAYAK: kembalikan stok sebesar qty
  → Jika TIDAK LAYAK: stok tidak kembali, catat sebagai kerugian barang

EVENT: Stok masuk manual (OWNER/STAFF input)
  → Tambah stok sebesar qty_masuk
  → Buat stock_movement record dengan tipe INBOUND
  → Update alert jika sebelumnya TIPIS/HABIS
```

---

## 6. ALUR SYARIAH & ZAKAT

### 6.1 Prinsip Dasar Syariah yang Diimplementasikan

| Prinsip | Implementasi Teknis | ID Rule |
|---|---|---|
| **Al-Ribh (Laba Halal)** | Pendapatan hanya dari transaksi SELESAI | BR-SYR-001 |
| **Bebas Gharar** | Semua biaya harus memiliki nilai eksplisit | BR-SYR-002 |
| **Bebas Zalim** | Ongkir pembeli ≤ ongkir kurir | BR-SYR-003 |
| **Zakat Mal** | Kalkulasi wajib jika nishab + haul terpenuhi | BR-SYR-004 |

### 6.2 Alur Kalkulasi Zakat Mal

```
TRIGGER: Setiap hari pukul 00:01 WIB (cron job) ATAU setiap ada perubahan saldo/stok

STEP 1 — Ambil Data Terkini:
  • Saldo / Uang tunai toko (input manual OWNER)
  • Nilai stok barang = SUM(harga_modal × stok_saat_ini) semua produk aktif
  • Hutang jangka pendek (input manual OWNER)
  • Tanggal mulai haul (dicatat otomatis saat pertama kali nishab tercapai)

STEP 2 — Ambil Harga Emas:
  • Panggil Gold Price API
  • Jika API gagal: gunakan cache terakhir + tampilkan disclaimer
  • Jika cache expired > 24 jam: tampilkan warning, minta OWNER konfirmasi manual

STEP 3 — Hitung Nishab:
  Nishab = 85 gram × harga_emas_hari_ini

STEP 4 — Hitung Harta Wajib Zakat:
  HWZ = Saldo + Nilai_Stok − Hutang_Jangka_Pendek

STEP 5 — Evaluasi Kewajiban:
  JIKA HWZ >= Nishab DAN haul >= 354 hari:
    → Kewajiban Zakat = HWZ × 2.5%
    → Status: WAJIB_ZAKAT
    → Tampilkan alert di dashboard
    → Kirim notifikasi WA ke OWNER

  JIKA HWZ >= Nishab DAN haul < 354 hari:
    → Status: MENUJU_NISHAB
    → Tampilkan progress haul di dashboard
    → Tidak ada kewajiban zakat

  JIKA HWZ < Nishab:
    → Status: BELUM_NISHAB
    → Reset penghitung haul ke 0
    → Status: BELUM_WAJIB_ZAKAT

STEP 6 — Update Dashboard:
  • Tampilkan status di Syariah Compliance Card
  • Simpan history kalkulasi di tabel zakat_calculations
```

### 6.3 Alur Konfirmasi Zakat Terbayar

```
TRIGGER: OWNER telah membayar zakat ke lembaga penerima

STEP 1 — OWNER membuka halaman Zakat di dashboard
STEP 2 — OWNER klik "Tandai Zakat Sudah Dibayar"
STEP 3 — OWNER mengisi form konfirmasi:
  • Nominal yang dibayarkan (Rp)
  • Tanggal pembayaran
  • Lembaga penerima (pilih dari daftar terverifikasi, lihat Seksi 7)
  • Bukti pembayaran (foto/PDF, opsional tapi sangat dianjurkan)

STEP 4 — Sistem:
  • Simpan record ke tabel zakat_payments
  • Update status zakat periode ini menjadi SUDAH_DIBAYAR
  • Reset penghitung haul untuk periode berikutnya
  • Generate konfirmasi PDF "Bukti Pencatatan Zakat"

BUSINESS RULES:
  BR-ZKT-001: Satu periode haul hanya bisa dikonfirmasi satu kali
  BR-ZKT-002: Nominal yang dibayar tidak harus sama persis dengan kalkulasi sistem
               (OWNER mungkin membulatkan ke atas — ini diizinkan dan dicatat)
  BR-ZKT-003: Jika nominal yang dibayar < kalkulasi sistem, sistem mencatat selisih
               sebagai "Zakat Kurang Bayar" dan menampilkan reminder
  BR-ZKT-004: History zakat seluruh periode tersimpan permanen dan bisa di-export
               untuk keperluan audit/laporan tahunan
  BR-ZKT-005: Bukti pembayaran zakat disimpan di S3 dengan enkripsi, TTL 7 tahun
```

---

## 7. ALUR VERIFIKASI MASJID / LEMBAGA PENERIMA ZAKAT

> ⚠️ **CATATAN UNTUK TIM DEVELOPER & PRODUCT OWNER**
>
> Fitur ini **tidak tercantum dalam PRD v1.0** yang ada. Seksi ini dibuat sebagai
> **placeholder terstruktur** berdasarkan kebutuhan yang disebutkan saat permintaan dokumen.
>
> **Sebelum development dimulai, Product Owner wajib:**
> 1. Mengkonfirmasi apakah fitur ini masuk v1.0 atau v2.0
> 2. Mendefinisikan persyaratan legal (apakah harus bekerja sama dengan BAZNAS?)
> 3. Mendefinisikan siapa yang berwenang menjadi verifikator lembaga
> 4. Update PRD dengan section baru untuk fitur ini
>
> Aturan bisnis di seksi ini berstatus **DRAFT — BELUM FINAL** dan ditandai 🔲.

---

### 7.1 Definisi Lembaga Penerima Zakat

**Lembaga Penerima Zakat** adalah entitas yang:
- Berstatus masjid aktif, pesantren, atau Lembaga Amil Zakat (LAZ) resmi
- Sudah melalui proses verifikasi oleh tim Aplikasi Laporan Shopee
- Terdaftar dalam sistem dan bisa dipilih OWNER sebagai tujuan bayar zakat

### 7.2 Kategori Lembaga

| Kategori | Deskripsi | Verifikasi | Contoh |
|---|---|---|---|
| **BAZNAS** | Badan Amil Zakat Nasional — lembaga negara | Auto-verify (sudah resmi) | BAZNAS Pusat, BAZNAS Provinsi |
| **LAZ Nasional** | LAZ berizin OJK/Kemenag skala nasional | Verifikasi dokumen | Dompet Dhuafa, LAZISMU, LAZISNU |
| **LAZ Daerah** | LAZ lokal/daerah berizin Kemenag | Verifikasi dokumen + survey | LAZ daerah kabupaten/kota |
| **Masjid** | Masjid dengan rekening resmi pengurus | Verifikasi dokumen + telepon | Masjid At-Taqwa, dsb. |
| **Pesantren** | Pondok pesantren resmi | Verifikasi dokumen | Ponpes terdaftar Kemenag |

### 7.3 Alur Pendaftaran Lembaga Baru

> Status aturan: 🔲 DRAFT — Perlu konfirmasi Product Owner

```
INISIATOR: OWNER toko atau SUPER_ADMIN

STEP 1 — OWNER mengajukan lembaga baru via form:
  Data yang wajib diisi:
  • Nama lembaga resmi
  • Kategori (BAZNAS / LAZ Nasional / LAZ Daerah / Masjid / Pesantren)
  • Alamat lengkap + kota + provinsi
  • Nomor rekening resmi (bank + nama rekening + nomor)
  • Nomor SK izin operasional (untuk LAZ) atau SK pengurus (untuk masjid)
  • Nama kontak PIC lembaga + nomor WA/telepon
  • Dokumen pendukung (PDF): SK, izin operasional, NPWP (jika ada)

STEP 2 — Sistem otomatis:
  • Assign nomor tiket verifikasi: VRF-[TAHUN]-[NOMOR URUT]
  • Kirim email konfirmasi ke OWNER pengaju
  • Notifikasi ke SUPER_ADMIN untuk review

STEP 3 — SUPER_ADMIN melakukan verifikasi:

  3a. Verifikasi Administratif (dalam 2 hari kerja):
      • Cek kelengkapan dokumen
      • Validasi nomor SK di database Kemenag/OJK (jika tersedia API)
      • Jika dokumen tidak lengkap → REQUEST_MORE_INFO ke OWNER

  3b. Verifikasi Lanjutan (untuk Masjid & LAZ Daerah):
      • Konfirmasi via telepon ke PIC lembaga
      • Verifikasi rekening: transfer verifikasi Rp 1 (jika diperlukan)
      • Cek nama rekening sesuai nama lembaga

  3c. Keputusan:
      APPROVED → Lembaga masuk database dengan status ACTIVE
      REJECTED → Alasan penolakan dikirim ke OWNER pengaju
      PENDING_INFO → Minta dokumen tambahan, timer 7 hari

STEP 4 — Jika APPROVED:
  • Lembaga tersedia di dropdown "Pilih Lembaga" untuk semua OWNER
  • OWNER pengaju mendapat notifikasi + ucapan terima kasih
  • Lembaga ditandai dengan badge "Terverifikasi ✓"

STEP 5 — Maintenance (oleh SUPER_ADMIN):
  • Review ulang semua lembaga setiap 12 bulan
  • Lembaga yang tidak bisa dikonfirmasi ulang → status SUSPENDED
  • Lembaga SUSPENDED tidak muncul di dropdown (tapi history transaksi tetap ada)
```

### 7.4 Data Model Lembaga Penerima Zakat

```python
# Referensi untuk Developer — schema tabel lembaga_penerima_zakat

class LembagaPenerimaZakat(Base):
    __tablename__ = "lembaga_penerima_zakat"

    id              = Column(UUID, primary_key=True, default=uuid4)
    kode_lembaga    = Column(String(20), unique=True)  # LPZ-2026-001
    nama            = Column(String(200), nullable=False)
    kategori        = Column(Enum("BAZNAS","LAZ_NASIONAL","LAZ_DAERAH","MASJID","PESANTREN"))
    kota            = Column(String(100))
    provinsi        = Column(String(100))
    nama_rekening   = Column(String(200))
    nomor_rekening  = Column(String(50))
    nama_bank       = Column(String(100))
    pic_nama        = Column(String(100))
    pic_whatsapp    = Column(String(20))
    nomor_sk        = Column(String(100))
    status          = Column(Enum("PENDING","ACTIVE","SUSPENDED","REJECTED"),
                             default="PENDING")
    verified_by     = Column(UUID, ForeignKey("users.id"), nullable=True)
    verified_at     = Column(DateTime, nullable=True)
    pengaju_user_id = Column(UUID, ForeignKey("users.id"))
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, onupdate=func.now())
    next_review_at  = Column(Date)  # Review tahunan

    # Relasi
    dokumen         = relationship("LembagaDokumen", back_populates="lembaga")
    zakat_payments  = relationship("ZakatPayment",   back_populates="lembaga")
```

### 7.5 Aturan Bisnis Lembaga

| ID | Aturan | Status |
|---|---|---|
| 🔲 BR-LPZ-001 | Hanya lembaga dengan status `ACTIVE` yang bisa dipilih saat konfirmasi bayar zakat | DRAFT |
| 🔲 BR-LPZ-002 | BAZNAS otomatis berstatus `ACTIVE` tanpa proses verifikasi | DRAFT |
| 🔲 BR-LPZ-003 | Satu lembaga hanya bisa memiliki satu nomor rekening aktif | DRAFT |
| 🔲 BR-LPZ-004 | OWNER bisa menggunakan lembaga yang "belum terdaftar" dengan memilih "Lembaga Lain" dan mengisi manual — tapi tidak bisa dipilih OWNER lain | DRAFT |
| 🔲 BR-LPZ-005 | Lembaga yang memiliki complaint dari ≥ 3 OWNER berbeda masuk review khusus SUPER_ADMIN | DRAFT |
| 🔲 BR-LPZ-006 | Verifikasi lembaga tidak dipungut biaya apapun | DRAFT |
| 🔲 BR-LPZ-007 | Data lembaga (termasuk nomor rekening) dienkripsi di level kolom | DRAFT |

### 7.6 Pertanyaan Terbuka untuk Product Owner

Berikut adalah pertanyaan yang harus dijawab sebelum development Seksi 7 dimulai:

```
❓ Q1: Apakah fitur ini masuk scope v1.0 atau v2.0?
   → Jika v1.0: masukkan ke PRD segera dan update sprint planning
   → Jika v2.0: tandai sebagai roadmap, tidak perlu development sekarang

❓ Q2: Apakah perlu integrasi API dengan BAZNAS atau Kemenag untuk validasi lembaga?
   → Jika ya: butuh perjanjian kerja sama dan timeline integrasi
   → Jika tidak: verifikasi manual oleh SUPER_ADMIN

❓ Q3: Siapa yang berwenang menjadi verifikator final? Internal tim atau pihak ketiga?

❓ Q4: Apakah Aplikasi memungut fee dari transaksi zakat? (Model bisnis)

❓ Q5: Bagaimana jika OWNER bayar zakat di luar aplikasi (offline ke masjid)?
   → Apakah tetap bisa dicatat? (seperti di BR-ZKT-001–005 yang sudah ada)

❓ Q6: Apakah ada fitur transfer/redirect ke rekening lembaga dari dalam aplikasi?
   → Ini butuh lisensi fintech yang berbeda
```

---

## 8. ATURAN STOK & INVENTORI

### 8.1 Threshold Stok

| Kondisi | Threshold | Indikator UI | Notifikasi WA? |
|---|---|---|---|
| Stok Normal | > minimum konfigurasi | Hijau | ❌ |
| Stok Tipis | ≤ minimum (default: 5 pcs) | Kuning/Oranye | ✅ (1x per hari) |
| Stok Habis | = 0 | Merah | ✅ (langsung, tiap kejadian) |

**BR-STK-001:** OWNER bisa mengubah threshold minimum per produk (1–999 pcs).
Default global: 5 pcs. Tidak bisa di-set ke 0.

**BR-STK-002:** Alert stok tipis dikirim maksimal 1 kali per produk per hari via WA
untuk menghindari spam. Alert stok habis dikirim langsung setiap kejadian.

### 8.2 Aturan Stok Return

**BR-STK-003:** Barang return TIDAK otomatis kembali ke stok.
Alur inspeksi return wajib dilakukan:

```
Return masuk
    │
    ▼
Antrian Inspeksi (status: PENDING_INSPECTION)
    │
    ▼
OWNER/STAFF konfirmasi kondisi barang:
    │
    ├── "Layak Jual"
    │       → Stok bertambah sebesar qty
    │       → stock_movement tipe: RETURN_INBOUND
    │       → status return: RESTOCKED
    │
    └── "Tidak Layak Jual" (rusak, tidak bisa dijual ulang)
            → Stok TIDAK bertambah
            → Catat sebagai kerugian barang
            → stock_movement tipe: RETURN_DAMAGED
            → status return: DAMAGED_WRITE_OFF
```

**BR-STK-004:** Batas waktu konfirmasi inspeksi return: 7 hari.
Jika OWNER tidak konfirmasi dalam 7 hari, sistem menganggap "Tidak Layak Jual"
dan mencatatnya sebagai DAMAGED_WRITE_OFF otomatis.

### 8.3 Hubungan Stok dengan Laporan

**BR-STK-005:** Produk dengan stok 0 yang memiliki pesanan yang dibatalkan
HARUS dihubungkan ke laporan "Potensi Pendapatan Hilang" (PRD F-14):

```
Potensi Hilang = SUM(total_harga) pesanan DIBATALKAN yang alasannya "stok habis"
                 dalam periode yang dipilih
```

---

## 9. ATURAN EXPORT & PELAPORAN

### 9.1 Format & Konten per Jenis Laporan

| Format | Konten | Audience | Editabel? |
|---|---|---|---|
| **DOCX** | Ringkasan + narasi AI + tabel biaya + status syariah | OWNER, Akuntan | ✅ (draft untuk disunting) |
| **PDF** | Sama dengan DOCX + watermark "DRAFT" | Semua | ❌ |
| **XLSX** | Raw data semua transaksi + sheet ringkasan + sheet syariah | Akuntan, Audit | ✅ (data mentah) |

### 9.2 Data yang TIDAK Boleh Ada dalam Export

**BR-RPT-003 (detail):**

| Data | DOCX | PDF | XLSX | Alasan |
|---|---|---|---|---|
| Nama lengkap pembeli | ❌ | ❌ | ❌ | UU PDP No. 27/2022 |
| Nomor telepon pembeli | ❌ | ❌ | ❌ | UU PDP No. 27/2022 |
| Alamat lengkap pembeli | ❌ | ❌ | ❌ | UU PDP No. 27/2022 |
| Kota/Provinsi pembeli | ✅ (agregat) | ✅ (agregat) | ✅ (per baris) | Bukan PII jika tanpa nama |
| ID Pesanan | ✅ | ✅ | ✅ | Tidak mengidentifikasi individu |
| Nominal transaksi | ✅ | ✅ | ✅ | Data bisnis OWNER |
| Harga modal produk | ✅ | ✅ | ✅ | Data bisnis OWNER |

### 9.3 Aturan Akses & Distribusi Laporan

| ID | Aturan |
|---|---|
| **BR-RPT-006** | Link download laporan menggunakan pre-signed URL dengan TTL 24 jam |
| **BR-RPT-007** | Setelah 7 hari, file laporan dihapus dari server (user harus generate ulang) |
| **BR-RPT-008** | Log setiap aksi download laporan: siapa, kapan, format apa |
| **BR-RPT-009** | Laporan yang sama (periode + format) tidak digenerate ulang dalam 1 jam — cached |
| **BR-RPT-010** | STAFF tidak bisa mengakses atau mendownload laporan apapun |

---

## 10. ATURAN NOTIFIKASI WHATSAPP BOT

### 10.1 Prioritas & Frekuensi Notifikasi

| Jenis Notifikasi | Trigger | Frekuensi Maks | Jam Pengiriman |
|---|---|---|---|
| Stok habis | Stok = 0 | Tiap kejadian | Kapanpun |
| Stok tipis | Stok ≤ minimum | 1x per produk per hari | 08.00–20.00 WIB |
| Zakat nishab tercapai | HWZ ≥ nishab + haul terpenuhi | 1x saat pertama tercapai | 08.00–20.00 WIB |
| Return rate tinggi | Return rate > 5% | 1x per hari | 08.00 WIB |
| Laporan harian | Scheduled | 1x per hari (opsional, bisa dimatikan) | 08.00 WIB |
| OCR review pending | Ada OCR menunggu konfirmasi | 1x + 1x reminder | 09.00 WIB |
| Verifikasi lembaga | Status verifikasi berubah | Tiap perubahan | Kapanpun |

**BR-WA-001:** Total notifikasi push (tanpa diminta user) maksimal **5 pesan per hari per toko**
untuk mencegah spam dan menjaga user experience.

**BR-WA-002:** Notifikasi yang belum terkirim karena rate limit akan dikirim keesokan harinya
pukul 08.00 WIB, bukan ditumpuk di satu waktu.

**BR-WA-003:** OWNER bisa menonaktifkan jenis notifikasi tertentu dari pengaturan. Kecuali:
- Notifikasi stok habis (selalu aktif)
- Notifikasi zakat wajib (selalu aktif)
- Notifikasi security/akses data toko (selalu aktif)

---

## 11. MATRIKS KEPUTUSAN & EDGE CASES

### 11.1 Edge Cases yang Harus Ditangani Sistem

| Skenario | Kondisi | Keputusan Sistem | Referensi |
|---|---|---|---|
| Import CSV dengan baris campuran valid/invalid | Ada 100 baris, 95 valid, 5 error | Import 95 baris yang valid, report 5 error per baris | BR-TRX-004 |
| Transaksi sama di-import dua kali | id_pesanan duplikat | Abaikan duplikat, notifikasi user | BR-TRX-005 |
| Return melebihi qty pesanan awal | qty_return > qty_pesanan | Reject, tampilkan error | BR-TRX-004 |
| Saldo toko negatif | Saldo dikurangi hutang > saldo | Harta Wajib Zakat = 0, tidak dihitung negatif | BR-ZKT — EDGE |
| Harga emas API down > 24 jam | Cache expired | Tampilkan kalkulasi dengan harga terakhir + warning merah | AI_SPEC Seksi 4.4 |
| OWNER hapus semua produk | Nilai stok = 0 | HWZ = Saldo − Hutang (stok 0) | BR-SYR-004 |
| Return rate = 0% | Tidak ada return sama sekali | Kartu status hijau, tidak ada alert | PRD F-26 |
| Periode laporan tanpa transaksi | 0 transaksi dalam periode | Tampilkan pesan "Tidak ada transaksi" — tidak generate laporan | BR-RPT-001 |
| OCR upload file korup | File tidak bisa dibaca | Reject, tampilkan pesan error spesifik | DEV_GUIDE Seksi 1.4.3 |
| Zakat sudah dibayar tapi lebih dari kalkulasi | Bayar > kewajiban | Simpan selisih sebagai "Lebih Bayar", tidak ada aksi tambahan | BR-ZKT-002 |
| Zakat sudah dibayar tapi kurang dari kalkulasi | Bayar < kewajiban | Simpan selisih sebagai "Kurang Bayar", tampilkan reminder | BR-ZKT-003 |
| STAFF mencoba akses laporan | Permission denied | 403 Forbidden + audit log | BR-ROLE-002 |
| SUPER_ADMIN akses toko tanpa request diapprove | Tidak ada tiket aktif | 403 Forbidden + security alert | BR-APV-003 |
| Nishab tercapai tapi haul belum terpenuhi | HWZ ≥ nishab, haul < 354 hari | Tampilkan progress haul, belum ada notifikasi wajib | BR-SYR-004 |

### 11.2 Decision Tree: Apakah Transaksi Masuk Laporan Syariah?

```
Transaksi Baru
       │
       ▼
  Status = SELESAI?
       │
  ┌────┴────┐
  ▼         ▼
 YA        TIDAK
  │         │
  │    → Tidak masuk Pendapatan Halal
  │       (masuk Omzet Kotor saja)
  ▼
Semua biaya memiliki nilai eksplisit?
(tidak ada admin_fee atau service_fee = null)
       │
  ┌────┴────┐
  ▼         ▼
 YA        TIDAK
  │         │
  │    → Flag GHARAR
  │       Tidak masuk laporan syariah
  │       Notifikasi OWNER
  ▼
ongkir_pembeli ≤ ongkir_kurir?
       │
  ┌────┴────┐
  ▼         ▼
 YA        TIDAK
  │         │
  │    → Flag ZALIM
  │       Tidak masuk Cash Flow Syariah
  │       Notifikasi OWNER
  ▼
✅ MASUK LAPORAN SYARIAH PENUH
(Al-Ribh + Cash Flow + basis Zakat)
```

---

## 12. RIWAYAT PERUBAHAN ATURAN

> Setiap perubahan aturan bisnis harus dicatat di sini dengan detail yang cukup
> untuk memahami konteks keputusan di masa depan.

| Versi | Tanggal | Perubahan | Diubah Oleh | Approved By |
|---|---|---|---|---|
| 1.0 | 4 Mei 2026 | Dokumen awal dibuat berdasarkan PRD v1.0 | Tech Lead | Product Owner |
| — | — | Seksi 7 (Verifikasi Masjid) berstatus DRAFT, menunggu konfirmasi PO | Tech Lead | Pending |

---

## LAMPIRAN A: Referensi Silang PRD ↔ Business Rules

| PRD Feature ID | Business Rule(s) | Seksi |
|---|---|---|
| F-01, F-02 | BR-TRX-001, BR-TRX-002, BR-TRX-004 | 4.1 |
| F-03, F-04, F-05 | BR-COST-001, BR-COST-002 | 4.2 |
| F-06, F-07, F-08 | BR-TRX-003, BR-STK-003, BR-STK-004 | 4.1, 8.2 |
| F-09, F-10 | BR-RPT-003 | 9.2 |
| F-11 | BR-STK-001, BR-STK-002, BR-STK-003 | 8.1, 8.2 |
| F-12, F-13, F-14 | BR-STK-001, BR-STK-005 | 8.1, 8.3 |
| F-15, F-16 | BR-RPT-001 hingga BR-RPT-005, Formula di 5.2 | 5.2, 9 |
| F-17, F-18, F-19 | BR-SYR-001, BR-TRX-003 | 6.1 |
| F-20 | BR-SYR-002, BR-COST-002 | 4.2, 6.1 |
| F-21 | BR-SYR-003, BR-COST-003 | 4.2, 6.1 |
| F-22, F-23, F-24, F-25 | BR-SYR-004, BR-ZKT-001 hingga BR-ZKT-005 | 6.2, 6.3 |
| F-26, F-27 | Matriks stok di 8.1, Return Rate formula di Glosarium | 8.1, 11.1 |
| F-28, F-29 | BR-RPT-003 (data geografi) | 9.2 |
| F-30, F-31 | BR-RPT-004, PROMPT-FINANCE-001 | 5.2, AI_SPEC |
| F-32, F-33 | BR-RPT-001 hingga BR-RPT-010 | 9.1, 9.2, 9.3 |
| NF-03 | BR-ROLE-001 hingga BR-ROLE-016, BR-APV-003 | 2, 3.2 |
| NF-06 | Formula eksplisit di 5.2, BR-COST-001 | 4.2, 5.2 |

---

## LAMPIRAN B: Kode Business Rule — Quick Reference

```
BR-ROLE-XXX    → Aturan Role & Permission (Seksi 2)
BR-APV-XXX     → Aturan Approval Workflow (Seksi 3)
BR-TRX-XXX     → Aturan Transaksi (Seksi 4.1)
BR-COST-XXX    → Aturan Kalkulasi Biaya (Seksi 4.2)
BR-RPT-XXX     → Aturan Laporan & Export (Seksi 9)
BR-SYR-XXX     → Aturan Syariah (Seksi 6.1)
BR-ZKT-XXX     → Aturan Zakat (Seksi 6.2, 6.3)
BR-LPZ-XXX     → Aturan Lembaga Penerima Zakat (Seksi 7) [DRAFT]
BR-STK-XXX     → Aturan Stok (Seksi 8)
BR-WA-XXX      → Aturan WhatsApp Bot (Seksi 10)
```

---

*Dokumen ini adalah living document. Perubahan aturan bisnis tanpa approval Product Owner
dan Tech Lead dianggap tidak sah dan tidak boleh diimplementasikan.*

*Last updated: 4 Mei 2026 | Review berikutnya: 4 Agustus 2026*
