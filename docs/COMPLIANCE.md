# COMPLIANCE.md
## Aplikasi Laporan Penjualan Shopee — Dokumen Kepatuhan & Privasi
**Versi:** 1.0 | **Tanggal:** Mei 2026 | **Referensi PRD:** v1.0 (Safitri Haryanti)  
**Audience:** Developer + Tim Legal  
**Status:** Draft — Wajib Review Legal sebelum Go-Live

---

## ⚠️ DISCLAIMER LEGAL

> Dokumen ini bersifat panduan teknis dan operasional internal. Seluruh kebijakan dalam dokumen ini **wajib divalidasi oleh konsultan hukum** yang memahami regulasi Indonesia sebelum diimplementasikan. Referensi regulasi bersifat informatif dan dapat berubah. Tim Engineering tidak bertanggung jawab atas interpretasi hukum dokumen ini.

---

## DAFTAR ISI

1. [KYC & AML (Know Your Customer / Anti-Money Laundering)](#1-kyc--aml)
2. [Audit Trail Specification](#2-audit-trail-specification)
3. [Four-Eyes Rules (Prinsip Empat Mata)](#3-four-eyes-rules)
4. [Mosque & Lembaga Amil Zakat Verification](#4-mosque--laz-verification)
5. [Privacy Policy](#5-privacy-policy)
6. [Data Retention Policy](#6-data-retention-policy)
7. [Incident Response & Breach Notification](#7-incident-response--breach-notification)
8. [Regulatory Reference Map](#8-regulatory-reference-map)

---

## 1. KYC & AML

### 1.1 Konteks & Landasan Regulasi

Aplikasi ini memproses data transaksi keuangan penjual UMKM di platform Shopee Indonesia. Meskipun aplikasi **bukan merupakan lembaga keuangan atau PSP (Payment Service Provider)**, data omzet dan laporan laba yang dihasilkan berpotensi digunakan sebagai dokumen keuangan resmi untuk keperluan:

- Pengajuan kredit UMKM ke lembaga keuangan
- Pelaporan pajak (PPh Final UMKM, PPN)
- Laporan zakat ke Lembaga Amil Zakat (LAZ)
- Audit internal atau audit pihak ketiga

Oleh karena itu, standar KYC diterapkan untuk memastikan **identitas pengguna terverifikasi** dan laporan yang dihasilkan tidak digunakan untuk tujuan pencucian uang.

**Regulasi Referensi:**
| Regulasi | Pasal/Ketentuan |
|---|---|
| UU No. 8 Tahun 2010 | Pencegahan dan Pemberantasan TPPU (Tindak Pidana Pencucian Uang) |
| POJK No. 12/POJK.01/2017 | Penerapan Program APU PPT di Sektor Jasa Keuangan |
| PMK No. 231/PMK.03/2019 | Akses informasi keuangan untuk keperluan perpajakan |
| UU No. 27 Tahun 2022 | Perlindungan Data Pribadi (UU PDP) |

---

### 1.2 Tingkatan KYC (KYC Tier)

Aplikasi menerapkan tiga tingkat verifikasi berdasarkan volume transaksi dan fungsi yang diakses:

```
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 1 — BASIC (Default saat registrasi)                          │
│  ✔ Email terverifikasi                                              │
│  ✔ Nomor HP aktif (OTP)                                             │
│  Batas: Laporan internal saja, export tidak tersedia               │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 2 — STANDARD (Untuk akses export & laporan zakat)            │
│  ✔ Semua Tier 1                                                     │
│  ✔ NIK (Nomor Induk Kependudukan) — divalidasi format              │
│  ✔ Nama lengkap sesuai KTP                                          │
│  ✔ Nama toko Shopee aktif                                           │
│  Batas: Export DOCX/PDF/XLSX, laporan zakat, integrasi LAZ         │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 3 — ENHANCED (Untuk fitur API & multi-user)                  │
│  ✔ Semua Tier 2                                                     │
│  ✔ Selfie dengan KTP (liveness check opsional)                     │
│  ✔ NPWP (opsional, wajib jika omzet > Rp 500 jt/tahun)            │
│  ✔ Nomor rekening bank terverifikasi                                │
│  Batas: Akses API key, fitur multi-pengguna, laporan ke pihak ketiga│
└─────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Proses Verifikasi KYC

```
Registrasi User
      │
      ▼
[TIER 1] Email + OTP HP
      │ Otomatis, real-time
      ▼
User memilih upgrade ke Tier 2
      │
      ▼
Input NIK + Nama Lengkap
      │
      ├── Validasi format NIK (16 digit, checksum provinsi)
      ├── Cek NIK tidak duplikat di sistem
      └── Simpan NIK_HASH (bukan NIK plaintext) di DB
      │
      ▼ (jika NIK valid)
[TIER 2 AKTIF] — Notifikasi email
      │
      ▼ (opsional, dipicu jika omzet > threshold)
[TIER 3] Upload foto KTP + selfie
      │
      ├── Simpan di encrypted file storage
      ├── Review manual oleh Tim Compliance (SLA: 2x24 jam)
      └── Hasil notifikasi email + in-app
```

---

### 1.4 Indikator AML — Transaction Monitoring

Sistem melakukan monitoring otomatis untuk mendeteksi pola transaksi yang mencurigakan. **Tidak ada tindakan otomatis** — semua flag hanya memicu review internal Tim Compliance.

| ID | Indikator | Threshold | Aksi |
|---|---|---|---|
| AML-01 | Lonjakan omzet mendadak | > 500% dari rata-rata 30 hari | Flag + alert Tim Compliance |
| AML-02 | Jumlah order tidak wajar | > 500 order/hari untuk akun baru (<30 hari) | Flag + temporary soft-lock |
| AML-03 | Return rate ekstrem | > 50% dalam 7 hari berturut-turut | Flag + notifikasi ke user |
| AML-04 | Nilai transaksi tunggal besar | Single order > Rp 50.000.000 | Flag + review manual |
| AML-05 | Pola transaksi merata (structuring) | Banyak transaksi senilai hampir sama dalam 24 jam | Flag |
| AML-06 | Perubahan data identitas mendadak | Ganti NIK/email/rekening setelah transaksi besar | Flag + 24 jam cooling period |

**Mekanisme Flag:**
```
Trigger AML-XX
      │
      ▼
INSERT INTO aml_flags (user_id, flag_code, details, status='PENDING')
      │
      ▼
Notifikasi Slack/Email → Tim Compliance
      │
      ▼
Review oleh Compliance Officer (SLA 2x24 jam)
      │
      ├── CLEAR   → Update aml_flags.status = 'CLEARED', akun normal
      ├── ESCALATE → Eskalasi ke manajemen, kemungkinan suspend sementara
      └── SAR     → Laporan ke PPATK (Pusat Pelaporan dan Analisis Transaksi Keuangan)
                    [hanya jika ada indikasi TPPU nyata, melalui proses legal]
```

---

### 1.5 Data KYC — Penyimpanan & Perlindungan

| Data | Penyimpanan | Enkripsi | Akses |
|---|---|---|---|
| Email | PostgreSQL | Plaintext (dibutuhkan untuk kirim notif) | Sistem + Admin |
| Nomor HP | PostgreSQL | AES-256 | Sistem + Admin |
| NIK | PostgreSQL | SHA-256 Hash (tidak reversible) | Compliance Officer |
| Nama Lengkap | PostgreSQL | AES-256 | Compliance Officer |
| Foto KTP/Selfie | File Storage (encrypted bucket) | AES-256 at rest | Compliance Officer |
| NPWP | PostgreSQL | AES-256 | Compliance Officer |

> **KRITIS:** NIK **tidak boleh** disimpan dalam bentuk plaintext di database manapun. Gunakan hash SHA-256 + salt unik per user untuk validasi duplikat.

---

## 2. Audit Trail Specification

### 2.1 Prinsip Dasar

Setiap perubahan data keuangan dalam sistem **harus dapat dibuktikan, dilacak, dan tidak dapat dimanipulasi**. Audit trail adalah pondasi kepercayaan laporan keuangan yang dihasilkan aplikasi ini.

**Prinsip yang diterapkan:**
- **Immutability:** Record transaksi tidak dapat dihapus secara fisik (hanya logical delete)
- **Non-repudiation:** Setiap aksi terikat pada identitas user yang terautentikasi
- **Completeness:** Semua perubahan state tercatat, termasuk yang gagal
- **Tamper-evidence:** Hash chaining pada audit log untuk deteksi manipulasi

---

### 2.2 Tabel `audit_logs` — Schema Lengkap

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identitas Pelaku
  user_id         UUID REFERENCES users(id),
  session_id      VARCHAR(255),                    -- JWT session identifier
  ip_address      INET NOT NULL,
  user_agent      TEXT,
  
  -- Objek yang Diubah
  table_name      VARCHAR(100) NOT NULL,
  record_id       UUID NOT NULL,
  action          VARCHAR(10) NOT NULL
                  CHECK (action IN ('INSERT','UPDATE','DELETE','VOID','EXPORT','LOGIN','LOGOUT','KYC_UPDATE')),
  
  -- Delta Data
  old_data        JSONB,                           -- State sebelum perubahan
  new_data        JSONB,                           -- State sesudah perubahan
  changed_fields  TEXT[],                          -- Array nama field yang berubah
  
  -- Konteks
  reason          TEXT,                            -- Alasan perubahan (wajib untuk UPDATE finansial)
  approved_by     UUID REFERENCES users(id),       -- Four-eyes: ID approver (jika berlaku)
  
  -- Integritas
  log_hash        CHAR(64) NOT NULL,               -- SHA-256 dari (id + record_id + old_data + new_data + created_at)
  previous_hash   CHAR(64),                        -- Hash dari audit_log sebelumnya (chain)
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk forensic query
CREATE INDEX idx_audit_user_time     ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table_record  ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_action        ON audit_logs(action, created_at DESC);

-- KRITIS: Tidak boleh ada UPDATE atau DELETE pada tabel ini
-- Enforced via PostgreSQL Row-Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_logs FOR INSERT WITH CHECK (TRUE);
-- Tidak ada policy untuk UPDATE/DELETE = operasi tersebut ditolak
```

---

### 2.3 Cakupan Audit — Tabel & Aksi

| Tabel | INSERT | UPDATE | DELETE/VOID | EXPORT | Catatan |
|---|---|---|---|---|---|
| `transactions` | ✅ | ✅ | ✅ (VOID only) | — | Hapus fisik dilarang |
| `operational_costs` | ✅ | ✅ | ✅ | — | |
| `stock_movements` | ✅ | ❌ | ❌ | — | Immutable setelah insert |
| `products` | ✅ | ✅ | ✅ | — | Hapus fisik = soft delete |
| `zakat_snapshots` | ✅ | ❌ | ❌ | — | Immutable snapshot |
| `financial_reports` | ✅ | ✅ | ❌ | ✅ | Export dicatat |
| `users` | ✅ | ✅ | ✅ | — | |
| `aml_flags` | ✅ | ✅ | ❌ | — | Status changes tercatat |
| `kyc_verifications` | ✅ | ✅ | ❌ | — | |

---

### 2.4 Hash Chaining — Implementasi Tamper Evidence

```typescript
// audit.service.ts
import crypto from 'crypto';

interface AuditEntry {
  id: string;
  recordId: string;
  oldData: object | null;
  newData: object | null;
  createdAt: string;
}

function computeLogHash(entry: AuditEntry, previousHash: string | null): string {
  const payload = JSON.stringify({
    id: entry.id,
    record_id: entry.recordId,
    old_data: entry.oldData,
    new_data: entry.newData,
    created_at: entry.createdAt,
    previous_hash: previousHash ?? 'GENESIS'
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Verifikasi integritas chain (dijalankan oleh Compliance Officer secara berkala)
async function verifyAuditChain(tableFilter?: string): Promise<boolean> {
  const logs = await db.auditLogs.findMany({
    where: { table_name: tableFilter },
    orderBy: { created_at: 'asc' }
  });

  for (let i = 0; i < logs.length; i++) {
    const expectedHash = computeLogHash(logs[i], logs[i - 1]?.log_hash ?? null);
    if (expectedHash !== logs[i].log_hash) {
      await alertComplianceTeam(`Chain broken at audit_log id: ${logs[i].id}`);
      return false;
    }
  }
  return true;
}
```

---

### 2.5 Audit Log — Format Event Spesifik

#### Event: Perubahan Status Transaksi

```json
{
  "table_name": "transactions",
  "record_id": "uuid-transaksi",
  "action": "UPDATE",
  "changed_fields": ["status", "cancel_reason"],
  "old_data": {
    "status": "SELESAI",
    "cancel_reason": null
  },
  "new_data": {
    "status": "RETURN",
    "cancel_reason": "Barang rusak saat pengiriman"
  },
  "reason": "Pembeli melaporkan kerusakan produk via Shopee Dispute",
  "ip_address": "180.252.xxx.xxx"
}
```

#### Event: Export Laporan Keuangan

```json
{
  "table_name": "financial_reports",
  "record_id": "uuid-report",
  "action": "EXPORT",
  "new_data": {
    "format": "PDF",
    "period_start": "2026-04-01",
    "period_end": "2026-04-30",
    "file_size_kb": 248,
    "download_ip": "180.252.xxx.xxx"
  }
}
```

---

### 2.6 Retention Audit Log

- **Minimum retention:** 7 tahun (sesuai ketentuan perpajakan Indonesia)
- **Storage:** Database primer + backup terenkripsi di cold storage
- **Akses:** Read-only untuk Compliance Officer; tidak dapat dimodifikasi oleh siapapun
- **Verifikasi chain:** Dijalankan otomatis setiap minggu via cron job

---

## 3. Four-Eyes Rules (Prinsip Empat Mata)

### 3.1 Definisi & Tujuan

**Four-Eyes Principle** mensyaratkan bahwa tindakan berisiko tinggi **tidak dapat dieksekusi oleh satu orang saja** — melainkan membutuhkan persetujuan dari pihak kedua yang independen. Dalam konteks aplikasi ini, prinsip ini diterapkan pada operasi yang berdampak pada:

- Integritas data keuangan
- Akses ke data KYC sensitif
- Konfigurasi sistem yang mempengaruhi kalkulasi zakat/laporan

---

### 3.2 Tabel Operasi yang Memerlukan Four-Eyes

| ID | Operasi | Requestor | Approver | Timeout |
|---|---|---|---|---|
| FE-01 | Void / pembatalan transaksi yang sudah SELESAI | Operator | Pemilik Toko / Admin | 24 jam |
| FE-02 | Koreksi nilai transaksi (edit `final_price` atau `cogs`) | Operator | Compliance Officer | 24 jam |
| FE-03 | Reset/rekonfigurasi threshold stok minimum | Admin | Pemilik Toko | 1 jam |
| FE-04 | Akses data KYC Tier 3 (foto KTP/selfie) | Compliance Officer | Compliance Lead | 4 jam |
| FE-05 | Ekspor massal data pengguna (> 100 records) | Admin | Compliance Officer | 4 jam |
| FE-06 | Perubahan konstanta kalkulasi zakat (nishab default) | Developer | Syariah Advisor + Compliance Officer | 48 jam |
| FE-07 | Clear / update status AML flag ke CLEARED | Compliance Officer | Compliance Lead | 24 jam |
| FE-08 | Hapus akun pengguna secara permanen | Admin | Compliance Officer | 48 jam |

---

### 3.3 Alur Four-Eyes — Teknis

```
Requestor melakukan aksi berisiko tinggi
              │
              ▼
Sistem mendeteksi aksi memerlukan Four-Eyes (berdasarkan tabel FE-XX)
              │
              ▼
INSERT INTO approval_requests:
  {
    action_code: "FE-01",
    requestor_id: user.id,
    target_record: { table, record_id },
    payload: { perubahan yang akan dilakukan },
    status: "PENDING",
    expires_at: NOW() + interval '24 hours'
  }
              │
              ▼
Notifikasi ke Approver (email + in-app notification)
              │
              ├── Approver APPROVE
              │     │
              │     ▼
              │   Eksekusi aksi + INSERT audit_log (approved_by = approver.id)
              │   UPDATE approval_requests.status = 'APPROVED'
              │
              ├── Approver REJECT
              │     │
              │     ▼
              │   Aksi tidak dieksekusi
              │   UPDATE approval_requests.status = 'REJECTED'
              │   Notifikasi ke Requestor + alasan penolakan
              │
              └── TIMEOUT (expires_at terlewati)
                    │
                    ▼
                  Aksi dibatalkan otomatis
                  UPDATE approval_requests.status = 'EXPIRED'
                  Notifikasi ke Requestor
```

---

### 3.4 Schema Tabel `approval_requests`

```sql
CREATE TABLE approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code     VARCHAR(10) NOT NULL,               -- FE-01, FE-02, dst.
  
  requestor_id    UUID REFERENCES users(id) NOT NULL,
  approver_id     UUID REFERENCES users(id),          -- Diisi saat approved/rejected
  
  target_table    VARCHAR(100),
  target_record   UUID,
  payload         JSONB NOT NULL,                     -- Data perubahan yang akan dilakukan
  reason          TEXT NOT NULL,                      -- Alasan requestor
  reject_reason   TEXT,                               -- Alasan jika ditolak
  
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  
  expires_at      TIMESTAMPTZ NOT NULL,
  actioned_at     TIMESTAMPTZ,                        -- Kapan di-approve/reject
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_status    ON approval_requests(status, expires_at);
CREATE INDEX idx_approval_requestor ON approval_requests(requestor_id);
CREATE INDEX idx_approval_action    ON approval_requests(action_code, status);
```

---

### 3.5 Role Hierarchy untuk Four-Eyes

```
┌────────────────────────────────────────┐
│  SYARIAH_ADVISOR                       │  ← Validasi FE-06 (konstanta zakat)
│  (Eksternal / konsultan)               │
├────────────────────────────────────────┤
│  COMPLIANCE_LEAD                       │  ← Approver untuk FE-04, FE-07
│  (Internal, senior)                    │
├────────────────────────────────────────┤
│  COMPLIANCE_OFFICER                    │  ← Approver untuk FE-02, FE-05, FE-08
│  (Internal)                            │
├────────────────────────────────────────┤
│  ADMIN                                 │  ← Approver untuk FE-01, FE-03
│  (Pemilik toko / admin akun)           │
├────────────────────────────────────────┤
│  OPERATOR                              │  ← Requestor saja, tidak bisa approve
│  (Staff input data)                    │
└────────────────────────────────────────┘
```

> **KRITIS:** Seorang user **tidak dapat menjadi requestor sekaligus approver** pada approval_request yang sama. Enforced di application layer DAN database constraint.

---

## 4. Mosque & LAZ Verification (Verifikasi Masjid & Lembaga Amil Zakat)

### 4.1 Konteks

Fitur Syariah Compliance Engine (khususnya perhitungan zakat — F-22 s/d F-25) memungkinkan pengguna untuk:

1. Mengetahui kewajiban zakat mal berdasarkan data keuangan mereka
2. Mendapatkan laporan zakat yang dapat diserahkan ke Lembaga Amil Zakat (LAZ)
3. Di versi mendatang: integrasi pembayaran zakat langsung ke LAZ resmi

Untuk memastikan integritas ekosistem zakat, sistem memverifikasi **legitimasi LAZ** sebelum data pengguna dapat dibagikan.

---

### 4.2 Daftar LAZ yang Diakui

Sistem hanya mengizinkan integrasi dengan LAZ yang telah **mendapat izin resmi dari BAZNAS (Badan Amil Zakat Nasional)** sesuai UU No. 23 Tahun 2011 tentang Pengelolaan Zakat.

```sql
CREATE TABLE recognized_laz (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laz_name        VARCHAR(255) NOT NULL,
  laz_code        VARCHAR(50) UNIQUE NOT NULL,
  baznas_license  VARCHAR(100) NOT NULL,          -- Nomor izin BAZNAS
  license_expiry  DATE NOT NULL,
  website_url     VARCHAR(255),
  api_endpoint    VARCHAR(255),                   -- Endpoint integrasi (v2.0)
  is_active       BOOLEAN DEFAULT TRUE,
  verified_by     UUID REFERENCES users(id),      -- Compliance Officer yang verifikasi
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**LAZ Tier-1 (Pre-approved untuk v1.0):**
| Nama LAZ | Kode | Catatan |
|---|---|---|
| BAZNAS Pusat | BAZNAS-PUSAT | Lembaga pemerintah, prioritas utama |
| Rumah Zakat | LAZ-RZ | LAZ nasional berizin |
| Dompet Dhuafa | LAZ-DD | LAZ nasional berizin |
| YDSF | LAZ-YDSF | LAZ nasional berizin |
| Laz Muhammadiyah (LazisMu) | LAZ-LAZISMU | Organisasi masa berizin |
| Laz NU (LAZISNU) | LAZ-LAZISNU | Organisasi masa berizin |

---

### 4.3 Proses Verifikasi LAZ Baru

```
LAZ mengajukan permintaan integrasi
              │
              ▼
Tim Legal memverifikasi:
  ✔ Nomor izin BAZNAS valid & aktif
  ✔ Akta pendirian yayasan
  ✔ NPWP lembaga
  ✔ Laporan keuangan LAZ (opsional, untuk LAZ besar)
              │
              ▼
Compliance Officer menambahkan ke recognized_laz
  dengan status is_active = FALSE
              │
              ▼
Four-Eyes: Compliance Lead mereview & approve
  (action code: FE-LAZ-01)
              │
              ▼
is_active = TRUE → LAZ dapat muncul di pilihan pengguna
              │
              ▼
Audit log dicatat + notifikasi ke Tim Legal
```

---

### 4.4 Laporan Zakat untuk LAZ — Konten & Format

Dokumen laporan zakat yang dapat dihasilkan sistem (dalam format PDF/DOCX) mencakup:

```
LAPORAN ZAKAT MAL
================================
Nama Muzakki (Pembayar Zakat): [Nama Pengguna]
NIK: [Disensor: xxxxxxxxxxxxxxxx] (4 digit terakhir saja)
Periode Penilaian: [Tanggal]

KOMPONEN HARTA
--------------
1. Uang Tunai / Saldo         : Rp [jumlah]
2. Nilai Stok Barang          : Rp [jumlah]
3. Piutang Dagang             : Rp [jumlah] (opsional)
   (-) Hutang Jangka Pendek   : Rp [jumlah]
   ─────────────────────────────────
   HARTA WAJIB ZAKAT          : Rp [jumlah]

REFERENSI NISHAB
----------------
Harga Emas per Gram           : Rp [jumlah] (per tanggal [tgl])
Nishab (85 gram emas)         : Rp [jumlah]
Status Nishab                 : TERCAPAI / BELUM TERCAPAI

KEWAJIBAN ZAKAT
---------------
Tarif Zakat                   : 2,5%
Zakat Wajib                   : Rp [jumlah]

Laporan ini dihasilkan secara otomatis oleh sistem.
Harap konfirmasi dengan amil zakat di LAZ pilihan Anda.
================================
```

---

### 4.5 Ketentuan Privasi dalam Integrasi LAZ

- Data pengguna **hanya dapat dibagikan ke LAZ** atas dasar **persetujuan eksplisit** pengguna (consent checkbox tersendiri, bukan bundled dengan ToS)
- Sistem **tidak mengirim NIK plaintext** ke LAZ — hanya nama dan jumlah zakat
- Setiap transmisi data ke LAZ dicatat di `audit_logs` dengan action `EXPORT_TO_LAZ`
- Pengguna dapat **mencabut consent** kapan saja, yang akan menghentikan transmisi data selanjutnya (tidak berlaku retroaktif)

---

## 5. Privacy Policy

### 5.1 Identitas Pengendali Data

```
Nama Aplikasi   : Aplikasi Laporan Penjualan Shopee
Pengendali Data : [Nama Perusahaan / Nama Pengembang]
Alamat          : [Alamat Perusahaan]
Email Kontak    : privacy@[domain].id
DPO (Data Protection Officer): [Nama DPO jika ada]
```

---

### 5.2 Data Pribadi yang Dikumpulkan

| Kategori | Data Spesifik | Dasar Hukum Pemrosesan | Wajib/Opsional |
|---|---|---|---|
| **Identitas Dasar** | Nama lengkap, Email, Nomor HP | Pelaksanaan kontrak (Pasal 20 UU PDP) | Wajib |
| **Identitas Formal** | NIK, Nama sesuai KTP | Kepatuhan hukum (Pasal 21 UU PDP) | Wajib (Tier 2) |
| **Identitas Pajak** | NPWP | Kepatuhan hukum | Opsional |
| **Data Biometrik** | Foto KTP, Selfie | Persetujuan eksplisit (Pasal 22 UU PDP) | Opsional (Tier 3) |
| **Data Transaksi** | Riwayat penjualan, omzet, laba | Pelaksanaan kontrak | Wajib (untuk layanan inti) |
| **Data Lokasi** | Provinsi/kota pembeli | Kepentingan sah (analitik bisnis) | Dari data Shopee |
| **Data Teknis** | IP address, user agent, session | Kepentingan sah (keamanan) | Otomatis |
| **Data Keuangan** | Saldo, stok, hutang (untuk zakat) | Persetujuan eksplisit | Wajib (fitur zakat) |

---

### 5.3 Tujuan Pemrosesan Data

| Tujuan | Data yang Digunakan | Dasar Hukum |
|---|---|---|
| Penyediaan layanan laporan penjualan | Data transaksi, produk | Kontrak |
| Kalkulasi zakat mal | Data keuangan, harga emas | Persetujuan |
| Verifikasi identitas (KYC) | NIK, nama, foto | Kepatuhan hukum |
| Deteksi kecurangan & AML | Data transaksi, pola perilaku | Kepentingan sah + Kepatuhan hukum |
| Pengiriman notifikasi | Email, nomor HP | Kontrak |
| Peningkatan layanan (analitik) | Data anonimisasi | Kepentingan sah |
| Audit trail & forensik | Semua data | Kepatuhan hukum |
| Integrasi LAZ (opsional) | Nama, jumlah zakat | Persetujuan eksplisit |

---

### 5.4 Hak Subjek Data (Sesuai UU PDP Pasal 5-16)

| Hak | Deskripsi | Cara Mengajukan | SLA Respons |
|---|---|---|---|
| **Hak Akses** | Mengakses data pribadi yang tersimpan | Melalui menu "Data Saya" di aplikasi | 14 hari kerja |
| **Hak Koreksi** | Memperbarui data yang tidak akurat | Form koreksi di aplikasi | 14 hari kerja |
| **Hak Penghapusan** | Meminta penghapusan data pribadi (Right to be Forgotten) | Email ke privacy@[domain].id | 30 hari kerja |
| **Hak Portabilitas** | Mendapatkan salinan data dalam format yang dapat dibaca mesin | Request via aplikasi (export JSON/CSV) | 14 hari kerja |
| **Hak Keberatan** | Menolak pemrosesan untuk tujuan tertentu | Email ke DPO | 14 hari kerja |
| **Hak Penarikan Consent** | Mencabut persetujuan yang pernah diberikan | Toggle di menu Privasi | Real-time |
| **Hak atas Pengambilan Keputusan Otomatis** | Meminta review manusia atas keputusan otomatis (termasuk AML flag) | Email ke Compliance Officer | 7 hari kerja |

> **Catatan untuk Developer:** Implementasikan endpoint `GET /user/data-export` yang menghasilkan JSON/ZIP semua data pengguna, dan endpoint `DELETE /user/account` yang memicu proses penghapusan sesuai kebijakan retensi.

---

### 5.5 Berbagi Data dengan Pihak Ketiga

| Pihak Ketiga | Data yang Dibagikan | Tujuan | Dasar |
|---|---|---|---|
| Gold Price API Provider | Tidak ada data pengguna | Ambil harga emas | Tidak berlaku |
| AI/LLM Provider (Anthropic/OpenAI) | Data transaksi anonimisasi | Generate insight | DPA (Data Processing Agreement) |
| LAZ (jika dipilih pengguna) | Nama, jumlah zakat | Penyaluran zakat | Persetujuan eksplisit |
| Penyedia infrastruktur cloud | Data terenkripsi | Hosting | DPA |
| Otoritas hukum (PPATK, pajak, pengadilan) | Data relevan | Kepatuhan hukum | Perintah hukum |

**Komitmen:** Aplikasi **tidak menjual data pengguna** kepada pihak ketiga komersial dalam bentuk apapun.

---

### 5.6 Transfer Data Lintas Negara

Jika infrastruktur atau layanan pihak ketiga berada di luar Indonesia:
- Pastikan negara tujuan memiliki perlindungan data setara atau lebih tinggi dari UU PDP
- Gunakan Standard Contractual Clauses (SCC) atau mekanisme transfer yang diakui
- Dokumentasikan di Data Transfer Impact Assessment (DTIA)
- Informasikan kepada pengguna di Privacy Notice

---

### 5.7 Keamanan Data

- **Enkripsi at rest:** AES-256 untuk data sensitif
- **Enkripsi in transit:** TLS 1.3 wajib di semua endpoint
- **Akses berlapis:** RBAC (Role-Based Access Control), prinsip least privilege
- **Pengujian keamanan:** Penetration testing minimal 1x per tahun
- **Vulnerability disclosure:** Email ke security@[domain].id

---

## 6. Data Retention Policy

### 6.1 Prinsip Retensi

Data hanya disimpan selama **diperlukan untuk tujuan yang sah** atau **diwajibkan oleh regulasi**. Setelah periode retensi berakhir, data dihapus secara permanen atau dianonimisasi.

**Hierarki prioritas retensi:**
1. Kewajiban hukum (perpajakan, AML) → mengalahkan permintaan penghapusan pengguna
2. Permintaan penghapusan pengguna
3. Kepentingan sah bisnis

---

### 6.2 Tabel Retensi per Kategori Data

| Kategori Data | Tabel | Periode Retensi | Dasar | Aksi Setelah Retensi |
|---|---|---|---|---|
| **Data Transaksi** | `transactions` | **7 tahun** sejak tanggal transaksi | PMK perpajakan | Anonimisasi (hapus data pribadi, simpan agregat) |
| **Biaya Operasional** | `operational_costs` | **7 tahun** | PMK perpajakan | Anonimisasi |
| **Laporan Keuangan** | `financial_reports` | **7 tahun** | PMK perpajakan | Anonimisasi |
| **Audit Log** | `audit_logs` | **7 tahun** | UU No. 8/2010 TPPU | Tidak dapat dihapus, diarsipkan ke cold storage |
| **Snapshot Zakat** | `zakat_snapshots` | **5 tahun** | Kepentingan sah | Hapus permanen |
| **Data KYC Tier 1-2** | `users` (NIK hash, nama) | **5 tahun** setelah akun dinonaktifkan | POJK KYC | Hapus permanen |
| **Data KYC Tier 3** (foto KTP) | File Storage | **3 tahun** setelah verifikasi atau penutupan akun | POJK KYC | Hapus permanen dari storage |
| **AML Flags** | `aml_flags` | **5 tahun** | UU No. 8/2010 | Arsip ke cold storage |
| **Persetujuan (Consent)** | `user_consents` | **Seumur hidup akun + 5 tahun** | UU PDP (bukti consent) | Arsip |
| **Data Stok** | `stock_movements`, `products` | **3 tahun** | Kepentingan sah | Hapus permanen |
| **Data Lokasi Pembeli** | `buyer_locations` | **2 tahun** | Kepentingan sah | Hapus permanen |
| **Session & Token** | Redis | **15 menit (access) / 7 hari (refresh)** | Keamanan | Auto-expire |
| **File Export** | File Storage | **30 hari** setelah generate | Kepentingan sah | Hapus otomatis |
| **Log Aplikasi (Server Log)** | Logging system | **90 hari** | Kepentingan sah | Hapus permanen |
| **AI Feedback Cache** | Redis | **24 jam** | Kepentingan sah | Auto-expire |

---

### 6.3 Proses Penghapusan Akun (Right to be Forgotten)

```
Pengguna meminta penghapusan akun
              │
              ▼
Sistem cek: apakah ada kewajiban retensi aktif?
              │
              ├── ADA kewajiban retensi (misal: data transaksi < 7 tahun)
              │       │
              │       ▼
              │   Partial anonymization:
              │     - Hapus: nama, email, HP, NIK hash, foto
              │     - Simpan: data transaksi dalam bentuk anonimisasi
              │     - User mendapat konfirmasi + penjelasan mengapa
              │       data transaksi tidak dapat dihapus penuh
              │
              └── TIDAK ADA kewajiban retensi
                      │
                      ▼
                  Full deletion:
                    - Soft delete akun (is_deleted = TRUE)
                    - Jadwalkan hard delete 30 hari kemudian
                      (masa tenggang jika user berubah pikiran)
                    - Setelah 30 hari: hapus semua data permanen
                    - Kirim konfirmasi email penghapusan
```

---

### 6.4 Anonimisasi Data Transaksi

Saat data transaksi harus disimpan untuk keperluan pajak tetapi pengguna meminta penghapusan, lakukan anonimisasi sebagai berikut:

```sql
-- Contoh anonimisasi transaksi setelah permintaan penghapusan
UPDATE transactions
SET
  -- Hapus referensi ke pengguna
  user_id = NULL,
  -- Ganti nama produk dengan kode generik
  product_id = NULL,  -- produk juga dianonimisasi
  -- Pertahankan data finansial untuk audit pajak
  original_price = original_price,   -- tetap
  final_price = final_price,         -- tetap
  status = status,                   -- tetap
  order_date = order_date            -- tetap
WHERE user_id = :deleted_user_id;

-- Hapus data yang tidak memiliki kewajiban retensi
DELETE FROM buyer_locations WHERE transaction_id IN (
  SELECT id FROM transactions WHERE user_id = :deleted_user_id
);
```

---

### 6.5 Automated Retention Job

```typescript
// Dijalankan setiap hari pukul 02:00 WIB via Cron Job

async function runRetentionCleanup() {
  const now = new Date();

  // Hapus file export yang sudah > 30 hari
  await cleanupExpiredExports(subDays(now, 30));

  // Hapus log server yang sudah > 90 hari
  await cleanupServerLogs(subDays(now, 90));

  // Hapus buyer_locations yang sudah > 2 tahun
  await cleanupBuyerLocations(subYears(now, 2));

  // Hapus stock_movements yang sudah > 3 tahun
  await cleanupStockMovements(subYears(now, 3));

  // Proses akun yang sudah 30 hari dalam status soft-deleted
  await processHardDeletion(subDays(now, 30));

  // Arsipkan audit_logs yang sudah > 7 tahun ke cold storage
  await archiveOldAuditLogs(subYears(now, 7));

  // Catat hasil cleanup ke sistem monitoring
  await logRetentionRun(results);
}
```

---

## 7. Incident Response & Breach Notification

### 7.1 Klasifikasi Insiden

| Level | Definisi | Contoh | Waktu Respons |
|---|---|---|---|
| **P1 — Critical** | Data breach yang mempengaruhi data pribadi pengguna | Kebocoran NIK/foto KTP, akses tidak sah ke DB | Segera (< 1 jam) |
| **P2 — High** | Ancaman potensial atau gangguan layanan signifikan | Upaya intrusi terdeteksi, downtime > 1 jam | < 4 jam |
| **P3 — Medium** | Anomali keamanan tanpa dampak langsung ke data | Peningkatan AML flag mendadak, brute force login | < 24 jam |
| **P4 — Low** | Masalah non-kritis | Bug yang mempengaruhi akurasi laporan kecil | < 7 hari |

---

### 7.2 Kewajiban Notifikasi Breach (UU PDP Pasal 46)

Jika terjadi breach yang mempengaruhi data pribadi:

```
T+0   : Insiden terdeteksi
T+1h  : Tim keamanan dikumpulkan, assessment awal
T+14h : Notifikasi ke Kominfo (Kementerian Komunikasi dan Informatika)
         [UU PDP mensyaratkan maksimal 14 hari kalender]
T+14h : Notifikasi ke pengguna yang terdampak (jika breach berisiko tinggi)
T+30h : Laporan lengkap ke Kominfo
T+90h : Post-mortem & remediation plan diserahkan ke manajemen
```

**Konten Notifikasi ke Pengguna:**
- Apa yang terjadi (tanpa detail teknis yang bisa dieksploitasi)
- Data apa yang terdampak
- Langkah yang telah diambil
- Langkah yang dapat diambil pengguna untuk melindungi diri
- Kontak untuk pertanyaan lebih lanjut

---

## 8. Regulatory Reference Map

### 8.1 Peta Regulasi ke Fitur Aplikasi

| Regulasi | Fitur Terdampak | Implementasi |
|---|---|---|
| **UU No. 27/2022 (UU PDP)** | Semua fitur yang memproses data pribadi | Privacy Policy, Hak Subjek Data, Retensi |
| **UU No. 8/2010 (TPPU)** | Monitoring transaksi, AML flag | AML-01 s/d AML-06, SAR reporting |
| **UU No. 23/2011 (Pengelolaan Zakat)** | Syariah Compliance Engine | Verifikasi LAZ, format laporan zakat |
| **PMK No. 231/2019 (Akses Data Pajak)** | Laporan keuangan, export | Retensi 7 tahun, format laporan |
| **POJK No. 12/2017 (APU PPT)** | KYC/AML | KYC Tier 1-3, monitoring threshold |
| **SNI ISO/IEC 27001** | Keamanan informasi | Enkripsi, akses kontrol, audit |

---

### 8.2 Checklist Go-Live Compliance

Sebelum aplikasi diluncurkan ke publik, pastikan semua item berikut telah diverifikasi:

**Tim Legal:**
- [ ] Privacy Policy divalidasi oleh konsultan hukum
- [ ] Terms of Service mencakup ketentuan penggunaan data
- [ ] Data Processing Agreement (DPA) ditandatangani dengan semua vendor
- [ ] Notifikasi ke Kominfo jika aplikasi memproses data pribadi dalam skala besar
- [ ] Konsultasi dengan BAZNAS atau ulama terkait metodologi kalkulasi zakat

**Tim Engineering:**
- [ ] Enkripsi AES-256 aktif di semua kolom sensitif
- [ ] Audit log hash chaining berfungsi dan terverifikasi
- [ ] Four-eyes approval flow diuji untuk semua FE-XX scenario
- [ ] Data retention job berjalan di staging selama 30 hari tanpa error
- [ ] Endpoint penghapusan akun (`DELETE /user/account`) diuji end-to-end
- [ ] Penetration testing selesai dan temuan P1/P2 sudah diperbaiki

**Tim Compliance:**
- [ ] Daftar LAZ terverifikasi dan lisensi BAZNAS aktif
- [ ] AML monitoring threshold dikalibrasi dengan data historis
- [ ] Prosedur SAR (Suspicious Activity Report) ke PPATK terdokumentasi
- [ ] DPO (Data Protection Officer) ditunjuk dan terdaftar

---

*Dokumen ini adalah living document dan wajib diperbarui setiap ada perubahan regulasi, perubahan arsitektur yang mempengaruhi pemrosesan data, atau insiden keamanan signifikan.*

**Maintainer:** Tim Legal + Tim Engineering  
**Review Cycle:** Setiap 6 bulan atau saat ada perubahan regulasi  
**Klasifikasi Dokumen:** CONFIDENTIAL — Internal Use Only
