# .ARCHITECTURE.md
## Aplikasi Laporan Penjualan Shopee
**Versi:** 1.0 | **Tanggal:** Mei 2026 | **Referensi PRD:** v1.0 (Safitri Haryanti)

---

## DAFTAR ISI

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Module Structure](#3-module-structure)
4. [Database Schema](#4-database-schema)
5. [Data Flow](#5-data-flow)
6. [API Specification (Ringkasan)](#6-api-specification-ringkasan)
7. [External Integrations](#7-external-integrations)
8. [Security & Non-Functional Constraints](#8-security--non-functional-constraints)

---

## 1. System Architecture Overview

Aplikasi ini menggunakan arsitektur **Monolith Modular** (Modular Monolith) pada fase v1.0, dengan pemisahan layer yang jelas agar mudah di-migrate ke microservices pada versi berikutnya.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│              Web Browser (React SPA / Next.js)                      │
│   Dashboard │ Laporan Keuangan │ Stok │ Syariah │ Export │ AI Chat  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS / REST / WebSocket
┌─────────────────────────▼───────────────────────────────────────────┐
│                         API GATEWAY LAYER                           │
│              (Express.js / Fastify + JWT Middleware)                │
│         Auth │ Rate Limiting │ Request Validation │ Logging         │
└──────┬────────────┬───────────────┬──────────────┬──────────────────┘
       │            │               │              │
┌──────▼──────┐ ┌───▼────────┐ ┌───▼───────┐ ┌───▼──────────────────┐
│ Transaction │ │   Stock    │ │  Syariah  │ │    Export Engine     │
│   Module    │ │   Module   │ │  Module   │ │  (DOCX/PDF/XLSX)     │
└──────┬──────┘ └───┬────────┘ └───┬───────┘ └───┬──────────────────┘
       │            │               │              │
┌──────▼────────────▼───────────────▼──────────────▼──────────────────┐
│                         SERVICE LAYER                               │
│   FinancialCalcService │ ZakatCalcService │ AIFeedbackService       │
│   GeoService           │ AlertService     │ ReportBuilderService    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                       DATA ACCESS LAYER                             │
│                   ORM (Prisma / TypeORM)                            │
└──────┬──────────────────────┬──────────────────────────────────────┘
       │                      │
┌──────▼──────┐        ┌──────▼──────┐
│  PostgreSQL │        │    Redis    │
│  (Primary   │        │   (Cache,   │
│   DB)       │        │  Sessions)  │
└─────────────┘        └─────────────┘
       │
┌──────▼────────────────────────────────────┐
│           EXTERNAL SERVICES               │
│  Gold Price API │ AI/LLM API │ File Store │
└───────────────────────────────────────────┘
```

### Prinsip Arsitektur

| Prinsip | Implementasi |
|---|---|
| **Separation of Concerns** | Tiap domain (Transaksi, Stok, Syariah, Geo) punya modul terpisah |
| **Single Source of Truth** | Satu database relasional sebagai master data |
| **Real-time Updates** | WebSocket untuk push notification stok & laporan |
| **Immutable Financial Records** | Transaksi tidak bisa dihapus, hanya di-void/return |
| **Audit Trail** | Semua perubahan data dicatat di tabel `audit_logs` |

---

## 2. Technology Stack

### Backend
| Komponen | Teknologi | Versi Min |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Fastify | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7.x |
| Queue | BullMQ (Redis-based) | 5.x |
| Auth | JWT + bcrypt | - |

### Frontend
| Komponen | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| State Management | Zustand |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Maps | React Leaflet |
| Real-time | Socket.IO Client |

### Export & File Generation
| Format | Library |
|---|---|
| DOCX | docx (npm) |
| PDF | Puppeteer (HTML-to-PDF) |
| XLSX | ExcelJS |

### Infrastructure
| Komponen | Pilihan |
|---|---|
| Hosting | Railway / Render / VPS |
| File Storage | Supabase Storage / S3-compatible |
| CI/CD | GitHub Actions |
| Monitoring | Uptime Kuma + Sentry |

---

## 3. Module Structure

```
src/
├── api/
│   ├── routes/
│   │   ├── transactions.routes.ts
│   │   ├── stock.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── syariah.routes.ts
│   │   ├── export.routes.ts
│   │   └── ai.routes.ts
│   └── middleware/
│       ├── auth.middleware.ts
│       ├── validation.middleware.ts
│       └── rateLimit.middleware.ts
│
├── modules/
│   ├── transaction/
│   │   ├── transaction.service.ts      # CRUD + kalkulasi omzet
│   │   ├── transaction.repository.ts
│   │   └── transaction.types.ts
│   ├── stock/
│   │   ├── stock.service.ts            # Inbound/Outbound/Return logic
│   │   ├── alert.service.ts            # Threshold alerting
│   │   └── stock.repository.ts
│   ├── financial/
│   │   ├── financial-calc.service.ts   # Omzet, Laba, Beban
│   │   └── report-builder.service.ts
│   ├── syariah/
│   │   ├── zakat-calc.service.ts       # Nishab + 2.5% calculation
│   │   ├── gharar-check.service.ts     # Fee transparency validation
│   │   └── syariah.repository.ts
│   ├── geo/
│   │   ├── geo.service.ts              # Distribusi pembeli per provinsi
│   │   └── geo.repository.ts
│   ├── ai/
│   │   ├── ai-feedback.service.ts      # Historical comparison + insight
│   │   └── ai.client.ts               # LLM API wrapper
│   └── export/
│       ├── docx.generator.ts
│       ├── pdf.generator.ts
│       └── xlsx.generator.ts
│
├── shared/
│   ├── database/
│   │   └── prisma.client.ts
│   ├── cache/
│   │   └── redis.client.ts
│   ├── queue/
│   │   └── bullmq.client.ts
│   ├── utils/
│   │   ├── currency.util.ts            # Rp formatting, rounding
│   │   └── date.util.ts
│   └── constants/
│       └── thresholds.ts               # Stok minimum = 5, Return alert = 5%
│
└── config/
    ├── env.ts
    └── swagger.ts
```

---

## 4. Database Schema

> **Engine:** PostgreSQL 15+ | **ORM:** Prisma  
> **Konvensi:** snake_case untuk nama tabel & kolom, UUID sebagai primary key

---

### 4.1 Tabel `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  shop_name     VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.2 Tabel `products` (Master SKU)
```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  sku           VARCHAR(100) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  cogs          NUMERIC(15,2) NOT NULL,   -- Cost of Goods Sold / Modal
  stock_current INT NOT NULL DEFAULT 0,
  stock_minimum INT NOT NULL DEFAULT 5,   -- Threshold alert kuning
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query stok kritis
CREATE INDEX idx_products_stock ON products(user_id, stock_current);
```

---

### 4.3 Tabel `transactions` (Domain Transaksi — F-01, F-02)
```sql
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  order_id          VARCHAR(100) UNIQUE NOT NULL,  -- ID Pesanan Shopee
  product_id        UUID REFERENCES products(id),
  
  -- Harga & Diskon
  original_price    NUMERIC(15,2) NOT NULL,
  discount_amount   NUMERIC(15,2) DEFAULT 0,
  final_price       NUMERIC(15,2) GENERATED ALWAYS AS (original_price - discount_amount) STORED,
  qty               INT NOT NULL DEFAULT 1,
  
  -- Status (F-02)
  status            VARCHAR(20) NOT NULL
                    CHECK (status IN ('SELESAI', 'DIBATALKAN', 'RETURN')),
  cancel_reason     TEXT,                           -- F-08: alasan batal/return
  
  -- Timestamps
  order_date        DATE NOT NULL,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date  ON transactions(user_id, order_date);
CREATE INDEX idx_transactions_status     ON transactions(user_id, status);
CREATE INDEX idx_transactions_product    ON transactions(product_id);
```

---

### 4.4 Tabel `operational_costs` (Domain Operasional — F-03, F-04, F-05)
```sql
CREATE TABLE operational_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Biaya Marketplace (F-03)
  service_fee     NUMERIC(15,2) DEFAULT 0,
  admin_fee       NUMERIC(15,2) DEFAULT 0,
  
  -- Biaya Pengiriman (F-04)
  shipping_cost   NUMERIC(15,2) DEFAULT 0,   -- ongkir ditanggung seller
  handling_fee    NUMERIC(15,2) DEFAULT 0,   -- F-20: harus eksplisit (bebas gharar)
  
  -- Biaya Pengemasan (F-05)
  packaging_box   NUMERIC(15,2) DEFAULT 0,   -- kardus
  packaging_wrap  NUMERIC(15,2) DEFAULT 0,   -- bubble wrap
  packaging_tape  NUMERIC(15,2) DEFAULT 0,   -- isolasi
  
  -- Total (computed)
  total_cost      NUMERIC(15,2) GENERATED ALWAYS AS (
                    service_fee + admin_fee + shipping_cost +
                    handling_fee + packaging_box + packaging_wrap + packaging_tape
                  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.5 Tabel `stock_movements` (Domain Stok — F-11)
```sql
CREATE TABLE stock_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID REFERENCES products(id),
  user_id        UUID REFERENCES users(id),
  
  movement_type  VARCHAR(20) NOT NULL
                 CHECK (movement_type IN ('INBOUND', 'OUTBOUND', 'RETURN')),
  qty            INT NOT NULL,               -- positif = masuk, negatif = keluar
  reference_id   UUID,                       -- FK ke transactions.id jika dari order
  notes          TEXT,
  
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, created_at DESC);
```

---

### 4.6 Tabel `buyer_locations` (Domain Geografis — F-09, F-10)
```sql
CREATE TABLE buyer_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  province        VARCHAR(100) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  postal_code     VARCHAR(10),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_buyer_locations_province ON buyer_locations(province);
CREATE INDEX idx_buyer_locations_city     ON buyer_locations(city);
```

---

### 4.7 Tabel `zakat_snapshots` (Domain Syariah — F-22 s/d F-25)
```sql
CREATE TABLE zakat_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  
  -- Input Kalkulasi
  cash_balance      NUMERIC(15,2) NOT NULL,   -- Uang tunai / saldo
  stock_value       NUMERIC(15,2) NOT NULL,   -- Nilai stok barang
  short_term_debt   NUMERIC(15,2) DEFAULT 0,  -- Hutang jangka pendek
  
  -- Data Emas (F-22)
  gold_price_per_gr NUMERIC(15,2) NOT NULL,   -- Harga emas saat snapshot
  nishab_grams      NUMERIC(5,2) DEFAULT 85,  -- 85 gram emas (standar)
  nishab_value      NUMERIC(15,2) NOT NULL,   -- nishab_grams × gold_price_per_gr
  
  -- Hasil
  zakat_base        NUMERIC(15,2) GENERATED ALWAYS AS
                      (cash_balance + stock_value - short_term_debt) STORED,
  is_nishab_reached BOOLEAN NOT NULL DEFAULT FALSE,
  zakat_amount      NUMERIC(15,2),            -- 2.5% jika nishab tercapai
  
  snapshot_date     DATE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.8 Tabel `financial_reports` (Cache Laporan — F-15, F-16)
```sql
CREATE TABLE financial_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  
  -- Formula Laporan (F-15)
  gross_revenue   NUMERIC(15,2) NOT NULL,   -- Omzet Kotor
  net_revenue     NUMERIC(15,2) NOT NULL,   -- Omzet Bersih
  total_cogs      NUMERIC(15,2) NOT NULL,   -- Modal Barang
  total_opex      NUMERIC(15,2) NOT NULL,   -- Beban Biaya
  net_profit      NUMERIC(15,2) NOT NULL,   -- Laba Bersih
  risk_loss       NUMERIC(15,2) DEFAULT 0,  -- Rugi Risiko
  
  -- Counters
  total_orders    INT NOT NULL,
  completed_orders INT NOT NULL,
  cancelled_orders INT NOT NULL,
  returned_orders  INT NOT NULL,
  return_rate     NUMERIC(5,2),             -- Persentase return
  
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_financial_reports_period ON financial_reports(user_id, period_start, period_end);
```

---

### 4.9 Tabel `audit_logs` (Immutability & Audit Trail)
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  table_name  VARCHAR(50) NOT NULL,
  record_id   UUID NOT NULL,
  action      VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
```

---

### 4.10 Entity Relationship Diagram (Ringkasan)

```
users
  │─── products ──────────── stock_movements
  │         │
  │─── transactions ──────── operational_costs
  │         │──────────────── buyer_locations
  │
  │─── financial_reports
  │─── zakat_snapshots
  └─── audit_logs
```

---

## 5. Data Flow

### 5.1 Alur Utama: Import & Proses Transaksi

```
┌──────────────────────────────────────────────────────────────┐
│  INPUT LAYER                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  CSV/Excel   │    │ Manual Input │    │  Future:      │  │
│  │  Shopee      │    │  Form UI     │    │  Shopee API   │  │
│  └──────┬───────┘    └──────┬───────┘    └───────┬───────┘  │
└─────────┼──────────────────┼────────────────────┼──────────┘
          │                  │                    │
          └──────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Import Parser  │
                    │  • Validasi     │
                    │  • Normalisasi  │
                    │  • Dedup check  │
                    └────────┬────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
    ┌──────────▼──┐  ┌───────▼──────┐  ┌──▼─────────────┐
    │  transactions│  │ operational  │  │ buyer_locations │
    │  (INSERT)   │  │ _costs       │  │ (INSERT)        │
    └──────────┬──┘  │ (INSERT)     │  └────────────────┘
               │     └───────────────┘
               │
    ┌──────────▼──────────────────────┐
    │    Stock Movement Trigger       │
    │  status = SELESAI → OUTBOUND    │
    │  status = RETURN  → INBOUND     │
    │  status = BATAL   → no change   │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │   Recalculate Financial Report  │
    │   (Async via BullMQ Queue)      │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │   Push Update via WebSocket     │
    │   → Dashboard client refresh   │
    └─────────────────────────────────┘
```

---

### 5.2 Alur Kalkulasi Keuangan (F-15)

```
transactions (status = SELESAI)
  └── SUM(final_price × qty)       → gross_revenue

transactions (status IN SELESAI, DIBATALKAN, RETURN)
  └── gross_revenue
      − SUM(batal.final_price)
      − SUM(return.final_price)    → net_revenue

operational_costs (JOIN transactions)
  └── SUM(total_cost)              → total_opex

products (JOIN transactions SELESAI)
  └── SUM(cogs × qty)              → total_cogs

laba_bersih = net_revenue − total_cogs − total_opex

risk_loss = SUM(opex pada transaksi RETURN)
```

---

### 5.3 Alur Kalkulasi Zakat (F-22 s/d F-25)

```
1. Fetch gold_price_per_gr ─→ External Gold Price API
                                (cached Redis, TTL 1 jam)
2. nishab_value = 85 gr × gold_price_per_gr

3. cash_balance  ─┐
   stock_value   ─┼─ zakat_base = cash + stock − debt
   short_term_debt─┘

4. IF zakat_base >= nishab_value:
     zakat_amount = zakat_base × 0.025
     is_nishab_reached = TRUE
     → Dashboard flag: "Harta Anda telah mencapai Nishab"
   ELSE:
     zakat_amount = 0
     is_nishab_reached = FALSE

5. INSERT INTO zakat_snapshots (hasil kalkulasi)
```

---

### 5.4 Alur AI Feedback (F-30, F-31)

```
Trigger: Setiap hari pukul 07:00 WIB (Cron Job)
         atau on-demand via dashboard button

1. Ambil data hari ini:
   - financial_reports (today)
   - financial_reports (7 hari lalu, 30 hari lalu)
   - stock_movements (today)
   - return rate (today vs average)

2. Build prompt → kirim ke LLM API:
   {
     "system": "Kamu adalah analis bisnis UMKM Shopee...",
     "user": "Data hari ini: {...}, data historis: {...}.
              Beri insight singkat dan saran actionable."
   }

3. Simpan response ke Redis (TTL 24 jam)

4. Tampilkan di Dashboard AI Feedback card
```

---

### 5.5 Alur Export Laporan (F-32, F-33)

```
User klik Export → Pilih format (DOCX / PDF / XLSX)
                       │
            ┌──────────▼──────────┐
            │  Export Job Queue   │
            │  (BullMQ)           │
            └──────────┬──────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
    ┌────▼────┐  ┌─────▼────┐  ┌─────▼────┐
    │  DOCX   │  │   PDF    │  │  XLSX    │
    │ docx-js │  │Puppeteer │  │ ExcelJS  │
    └────┬────┘  └─────┬────┘  └─────┬────┘
         └─────────────┼──────────────┘
                       │
            ┌──────────▼──────────┐
            │   File Storage      │
            │   (S3/Supabase)     │
            └──────────┬──────────┘
                       │
            Signed URL → Client Download
```

---

## 6. API Specification (Ringkasan)

> **Base URL:** `https://api.laporan-shopee.id/v1`  
> **Auth:** Bearer JWT Token (header: `Authorization: Bearer <token>`)  
> **Content-Type:** `application/json`  
> **Response Envelope:**
> ```json
> {
>   "success": true,
>   "data": { ... },
>   "meta": { "page": 1, "total": 100 }
> }
> ```

---

### 6.1 Auth Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/auth/register` | Registrasi akun baru |
| `POST` | `/auth/login` | Login, return JWT |
| `POST` | `/auth/refresh` | Refresh JWT token |
| `DELETE` | `/auth/logout` | Invalidate token |

---

### 6.2 Transactions

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `GET` | `/transactions` | List transaksi (filter: status, date, product) | F-01, F-02 |
| `POST` | `/transactions` | Tambah transaksi manual | F-01 |
| `POST` | `/transactions/import` | Bulk import CSV/Excel | F-01 |
| `GET` | `/transactions/:id` | Detail satu transaksi | F-01 |
| `PATCH` | `/transactions/:id/status` | Update status order | F-02 |
| `GET` | `/transactions/stats/cancellation` | Analisis alasan batal/return | F-08 |

**Contoh Request — Import CSV:**
```http
POST /transactions/import
Content-Type: multipart/form-data

file: <binary CSV>
```

**Contoh Response — GET /transactions:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_id": "SHP-20260501-001",
      "product_sku": "LED-BULB-9W",
      "original_price": 45000,
      "discount_amount": 5000,
      "final_price": 40000,
      "qty": 2,
      "status": "SELESAI",
      "order_date": "2026-05-01"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 354 }
}
```

---

### 6.3 Stock Management

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `GET` | `/products` | List produk + stok saat ini | F-11 |
| `GET` | `/products/:id/stock` | Riwayat mutasi stok | F-11 |
| `POST` | `/products/:id/stock/inbound` | Tambah stok manual | F-11 |
| `GET` | `/stock/alerts` | Produk di bawah threshold | F-12, F-13 |
| `GET` | `/stock/lost-revenue` | Potensi pendapatan hilang (out of stock) | F-14 |

**Contoh Response — GET /stock/alerts:**
```json
{
  "success": true,
  "data": [
    {
      "product_id": "uuid",
      "sku": "LED-BULB-9W",
      "stock_current": 3,
      "stock_minimum": 5,
      "alert_level": "WARNING",   // "WARNING" | "CRITICAL"
      "alert_color": "ORANGE"     // "ORANGE" | "RED"
    }
  ]
}
```

---

### 6.4 Financial Reports

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `GET` | `/reports/financial` | Laporan keuangan (period filter) | F-15, F-16 |
| `GET` | `/reports/financial/summary` | Ringkasan omzet, laba, beban | F-15 |
| `GET` | `/reports/return-rate` | Persentase return + alert status | F-26, F-27 |
| `GET` | `/reports/geo-distribution` | Distribusi pembeli per provinsi/kota | F-09, F-10 |

**Query Params — /reports/financial:**
```
?period_start=2026-04-01&period_end=2026-04-30
```

**Contoh Response:**
```json
{
  "success": true,
  "data": {
    "period_start": "2026-04-01",
    "period_end": "2026-04-30",
    "gross_revenue": 15000000,
    "net_revenue": 13500000,
    "total_cogs": 7000000,
    "total_opex": 1200000,
    "net_profit": 5300000,
    "risk_loss": 450000,
    "return_rate": 2.3,
    "return_alert": "NORMAL"    // "NORMAL" | "WARNING" | "CRITICAL"
  }
}
```

---

### 6.5 Syariah Compliance

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `GET` | `/syariah/zakat` | Kalkulasi zakat terkini | F-22 s/d F-25 |
| `POST` | `/syariah/zakat/snapshot` | Simpan snapshot zakat manual | F-22 |
| `GET` | `/syariah/cash-flow` | Laporan arus kas dengan syariah flagging | F-20, F-21 |
| `GET` | `/syariah/halal-income` | Pendapatan halal (status=SELESAI only) | F-17 |

**Contoh Response — GET /syariah/zakat:**
```json
{
  "success": true,
  "data": {
    "cash_balance": 25000000,
    "stock_value": 8000000,
    "short_term_debt": 2000000,
    "zakat_base": 31000000,
    "gold_price_per_gr": 1050000,
    "nishab_value": 89250000,
    "is_nishab_reached": false,
    "zakat_amount": 0,
    "message": "Harta belum mencapai Nishab. Terus tingkatkan usaha Anda."
  }
}
```

---

### 6.6 AI Feedback

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `GET` | `/ai/feedback` | Ambil feedback AI terkini (dari cache) | F-30, F-31 |
| `POST` | `/ai/feedback/refresh` | Generate ulang feedback AI on-demand | F-30 |

**Contoh Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-05-05T07:00:00Z",
    "insight": "Penjualan Anda naik 15% minggu ini, namun Laba Bersih turun 2%...",
    "recommendations": [
      "Kurangi bid iklan pada jam-jam sepi (00:00–06:00)",
      "Stok LED-BULB-9W hampir habis, segera lakukan reorder"
    ]
  }
}
```

---

### 6.7 Export

| Method | Endpoint | Deskripsi | PRD Ref |
|---|---|---|---|
| `POST` | `/export/docx` | Generate laporan DOCX | F-32 |
| `POST` | `/export/pdf` | Generate laporan PDF | F-32 |
| `POST` | `/export/xlsx` | Generate tabel detail XLSX | F-33 |
| `GET` | `/export/status/:job_id` | Cek status export job (async) | - |
| `GET` | `/export/download/:job_id` | Download file hasil export | F-32, F-33 |

**Request Body — POST /export/docx:**
```json
{
  "period_start": "2026-04-01",
  "period_end": "2026-04-30",
  "include_syariah": true,
  "include_zakat": true
}
```

---

### 6.8 Error Codes

| HTTP Status | Code | Deskripsi |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Input tidak valid |
| `401` | `UNAUTHORIZED` | Token tidak ada / expired |
| `403` | `FORBIDDEN` | Akses ditolak |
| `404` | `NOT_FOUND` | Resource tidak ditemukan |
| `409` | `DUPLICATE_ORDER` | order_id sudah ada |
| `422` | `BUSINESS_RULE_ERROR` | Pelanggaran aturan bisnis (misal: stok negatif) |
| `429` | `RATE_LIMIT_EXCEEDED` | Terlalu banyak request |
| `500` | `INTERNAL_ERROR` | Server error |

---

## 7. External Integrations

### 7.1 Gold Price API (untuk Nishab Zakat — F-22)

```typescript
// Cache strategy: Redis TTL 1 jam
// Fallback: pakai harga terakhir yang tersimpan di DB

GET https://api.goldprice.io/v2/price?currency=IDR&unit=GRAM
Authorization: Bearer <API_KEY>

// Response
{
  "price": 1050000,   // Rp per gram
  "updated_at": "2026-05-05T06:00:00Z"
}
```

**Fallback Chain:**
1. Redis cache (TTL 1 jam)
2. `zakat_snapshots.gold_price_per_gr` terbaru di DB
3. Konstanta fallback hardcoded (alert ke admin)

---

### 7.2 AI / LLM API (untuk Feedback — F-30, F-31)

```typescript
// Menggunakan Anthropic Claude API atau OpenAI
// Model: claude-sonnet / gpt-4o

POST https://api.anthropic.com/v1/messages
x-api-key: <API_KEY>

{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 500,
  "system": "Kamu adalah analis bisnis UMKM Shopee Indonesia...",
  "messages": [{
    "role": "user",
    "content": "Data penjualan: {json_data}. Beri insight dan rekomendasi."
  }]
}
```

---

## 8. Security & Non-Functional Constraints

### 8.1 Security

| Aspek | Implementasi |
|---|---|
| **Authentication** | JWT (access 15m + refresh 7d), stored in httpOnly cookie |
| **Encryption at Rest** | PostgreSQL TDE atau enkripsi kolom sensitif via pgcrypto |
| **Encryption in Transit** | HTTPS/TLS 1.3 wajib |
| **Input Validation** | Zod schema validation di semua endpoint |
| **SQL Injection** | Prisma parameterized queries (tidak ada raw SQL) |
| **Rate Limiting** | 100 req/min per user, 10 req/min untuk export endpoint |
| **Audit Trail** | Semua INSERT/UPDATE/DELETE dicatat di `audit_logs` |

### 8.2 Performance Targets (NF-01)

| Metric | Target |
|---|---|
| Dashboard load (10.000 transaksi) | < 3 detik |
| Report generation | < 5 detik |
| Export file (DOCX/PDF/XLSX) | < 30 detik (async) |
| API response (GET endpoints) | < 500ms p95 |
| Uptime | ≥ 99,5% |

### 8.3 Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Harga emas | Redis | 1 jam |
| Financial report summary | Redis | 5 menit |
| AI Feedback | Redis | 24 jam |
| Stock alerts | Redis | 30 detik |
| JWT blacklist (logout) | Redis | Durasi token |

### 8.4 Scalability Notes (NF-04)

- Database connection pooling via **PgBouncer** (atau Prisma connection limit)
- Export jobs dijalankan via **BullMQ queue** agar tidak memblok API
- Partisi tabel `transactions` berdasarkan `order_date` (RANGE partitioning) jika data > 500k rows
- Read replicas untuk query laporan berat (laporan historis, geo distribution)

---

*Dokumen ini adalah living document. Update setiap ada perubahan pada PRD atau keputusan teknis yang berdampak pada arsitektur.*

**Maintainer:** Tim Engineering | **Review Cycle:** Setiap sprint (2 minggu)
