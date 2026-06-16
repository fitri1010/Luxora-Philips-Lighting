# DEV_GUIDE.md
## Panduan Pengembangan Sistem — Developer Reference
### Aplikasi Laporan Penjualan Shopee

---

**Versi Dokumen:** 1.0  
**Tanggal:** 4 Mei 2026  
**Penulis:** Tech Lead / Senior Developer  
**Referensi:** PRD v1.0 (Safitri Haryanti) · AI_SPEC.md v1.0  
**Audience:** Frontend Developer · Backend Developer · DevOps Engineer  
**Status:** Living Document

---

## DAFTAR ISI

1. [Tech Stack & Arsitektur Sistem](#1-tech-stack--arsitektur-sistem)
2. [Coding Standards](#2-coding-standards)
3. [Git Workflow](#3-git-workflow)
4. [Testing Strategy](#4-testing-strategy)
5. [Deployment Guide](#5-deployment-guide)
6. [Onboarding Developer Baru](#6-onboarding-developer-baru)

---

## 1. TECH STACK & ARSITEKTUR SISTEM

### 1.1 Stack Resmi

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| **Frontend** | Next.js (React) | 15.x | App Router, SSR + CSR hybrid |
| **Styling** | Tailwind CSS | 4.x | Utility-first, custom design tokens |
| **State Management** | Zustand | 5.x | Lightweight, tanpa boilerplate Redux |
| **Backend** | FastAPI | 0.115.x | Python async, auto OpenAPI docs |
| **Database** | PostgreSQL | 16.x | Primary datastore |
| **ORM** | SQLAlchemy + Alembic | 2.x | Async ORM + migration |
| **Cache** | Redis | 7.x | Session, cache dashboard, job queue |
| **Job Queue** | Celery + Redis | 5.x | Async task: OCR, export, AI calls |
| **AI / LLM** | Anthropic Claude API | — | claude-sonnet-4-20250514 |
| **OCR Engine** | Claude Vision API | — | Primary; Tesseract sebagai fallback |
| **WhatsApp** | Twilio WA Business | — | Gateway inbound/outbound |
| **Export Engine** | python-docx · ReportLab · openpyxl | — | DOCX, PDF, XLSX |
| **Auth** | FastAPI-JWT-Auth | — | JWT RS256 |
| **Object Storage** | AWS S3 / Cloudflare R2 | — | File upload, hasil export |
| **Monitoring** | Sentry + Grafana + Prometheus | — | Error tracking + metrics |
| **CI/CD** | GitHub Actions | — | Lint, test, deploy otomatis |
| **Container** | Docker + Docker Compose | — | Dev & staging parity |
| **Orchestration** | Kubernetes (K8s) | — | Production only |

---

### 1.2 Diagram Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Next.js Web App (SSR)    │    WhatsApp Bot (Twilio)           │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                ▼                         ▼
┌──────────────────────────────────────────────────────────────── ┐
│                      API GATEWAY / NGINX                        │
│          Rate Limiting · SSL Termination · Routing              │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────┐   ┌─────────────────────────────────────┐
│   FastAPI Backend     │   │       Celery Worker Cluster         │
│   (Async REST API)    │◄──┤  - OCR Processing Job               │
│                       │   │  - Export Job (DOCX/PDF/XLSX)        │
│  - Auth Module        │   │  - AI Feedback Generation           │
│  - Transaction Module │   │  - Zakat Calculation Job            │
│  - Report Module      │   └──────────────┬──────────────────────┘
│  - WhatsApp Handler   │                  │
│  - AI Proxy           │                  │
└───────┬───────────────┘                  │
        │                                  │
        ▼                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                      DATA LAYER                               │
│  PostgreSQL (Primary)  │  Redis (Cache/Queue)  │  S3 (Files)  │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                           │
│  Claude API  │  Harga Emas API  │  Twilio  │  SMTP (Email)   │
└───────────────────────────────────────────────────────────────┘
```

---

### 1.3 Struktur Direktori Monorepo

```
shopee-laporan/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/                    # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx        # Dashboard utama
│   │   │   │   ├── laporan/
│   │   │   │   ├── stok/
│   │   │   │   ├── transaksi/
│   │   │   │   ├── syariah/
│   │   │   │   └── export/
│   │   │   └── api/                # Next.js API routes (BFF)
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn/ui primitives
│   │   │   ├── charts/             # Chart components
│   │   │   ├── cards/              # Status cards
│   │   │   └── forms/              # Form components
│   │   ├── stores/                 # Zustand stores
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utils, API client
│   │   └── types/                  # TypeScript types
│   │
│   └── api/                        # FastAPI backend
│       ├── app/
│       │   ├── main.py             # Entry point
│       │   ├── config.py           # Settings (Pydantic BaseSettings)
│       │   ├── database.py         # DB connection
│       │   ├── models/             # SQLAlchemy models
│       │   │   ├── transaction.py
│       │   │   ├── product.py
│       │   │   ├── stock.py
│       │   │   └── user.py
│       │   ├── schemas/            # Pydantic schemas (request/response)
│       │   ├── routers/            # FastAPI routers
│       │   │   ├── auth.py
│       │   │   ├── dashboard.py
│       │   │   ├── transactions.py
│       │   │   ├── reports.py
│       │   │   ├── whatsapp.py
│       │   │   └── ai.py
│       │   ├── services/           # Business logic layer
│       │   │   ├── ai_service.py
│       │   │   ├── ocr_service.py
│       │   │   ├── zakat_service.py
│       │   │   ├── report_service.py
│       │   │   └── whatsapp_service.py
│       │   ├── workers/            # Celery tasks
│       │   │   ├── ocr_worker.py
│       │   │   ├── export_worker.py
│       │   │   └── ai_worker.py
│       │   └── utils/
│       │       ├── prompt_registry.py
│       │       ├── csv_parser.py
│       │       └── validators.py
│       ├── migrations/             # Alembic migrations
│       └── tests/
│
├── packages/
│   ├── shared-types/               # Shared TypeScript types (web + API contract)
│   └── ui-kit/                     # Design system components
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml      # Development
│   │   ├── docker-compose.prod.yml # Production
│   │   └── Dockerfiles/
│   ├── k8s/                        # Kubernetes manifests
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   └── configmaps/
│   └── terraform/                  # Infrastructure as Code
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI: lint, test, build
│       ├── cd-staging.yml          # CD: deploy to staging
│       └── cd-production.yml       # CD: deploy to production
│
├── docs/
│   ├── PRD_App_Laporan_Penjualan_Shopee.md
│   ├── AI_SPEC.md
│   └── DEV_GUIDE.md                # ← Dokumen ini
│
├── .env.example                    # Template environment variables
├── turbo.json                      # Turborepo config
└── package.json                    # Root workspace
```

---

## 2. CODING STANDARDS

### 2.1 Prinsip Umum

Semua kode dalam proyek ini mengikuti prinsip berikut, secara berurutan:

1. **Correctness** — Kode harus benar sebelum dioptimasi
2. **Readability** — Kode dibaca lebih sering dari ditulis
3. **Simplicity** — Pilih solusi paling sederhana yang bekerja
4. **Performance** — Optimasi hanya jika ada data yang membuktikan bottleneck

> **Aturan Emas:** Jika reviewer perlu bertanya "apa yang dilakukan kode ini?", kode tersebut perlu direfactor.

---

### 2.2 Python (Backend — FastAPI)

#### 2.2.1 Formatter & Linter

```bash
# Formatter: Ruff (pengganti Black + isort)
ruff format .

# Linter: Ruff
ruff check . --fix

# Type checker: mypy
mypy apps/api/app --strict

# Konfigurasi di pyproject.toml:
[tool.ruff]
line-length = 88
target-version = "py312"
select = ["E", "F", "I", "N", "W", "B", "UP"]

[tool.mypy]
strict = true
python_version = "3.12"
```

#### 2.2.2 Konvensi Penamaan Python

```python
# ✅ BENAR

# Module names: snake_case
# ocr_service.py, zakat_service.py

# Class names: PascalCase
class TransactionService:
    pass

class ZakatCalculationResult:
    pass

# Function & variable names: snake_case
def calculate_zakat_obligation(harta_wajib_zakat: float) -> float:
    nishab = get_current_nishab()
    return harta_wajib_zakat * 0.025 if harta_wajib_zakat >= nishab else 0.0

# Constants: SCREAMING_SNAKE_CASE
MAX_UPLOAD_SIZE_MB = 10
ZAKAT_RATE = 0.025
DEFAULT_STOCK_ALERT_THRESHOLD = 5

# Private methods: prefix underscore
def _validate_order_status(status: str) -> bool:
    pass

# ❌ SALAH
def CalculateZakat(HartaWajibZakat):  # Campur konvensi
    pass

def calc_zkt(h):  # Abbreviasi tidak jelas
    pass
```

#### 2.2.3 Type Hints — Wajib di Semua Fungsi

```python
# ✅ BENAR — semua parameter dan return type dideklarasikan
from decimal import Decimal
from datetime import date
from typing import Optional
from pydantic import BaseModel

class ZakatCalculationInput(BaseModel):
    saldo: Decimal
    nilai_stok: Decimal
    hutang_jangka_pendek: Decimal
    harga_emas_per_gram: Decimal
    tanggal_haul_mulai: date

class ZakatCalculationResult(BaseModel):
    nishab_rp: Decimal
    harta_wajib_zakat: Decimal
    status_nishab: str  # "TERCAPAI" | "BELUM_TERCAPAI"
    haul_terpenuhi: bool
    kewajiban_zakat_rp: Optional[Decimal]
    pesan_notifikasi: str

async def calculate_zakat(
    input_data: ZakatCalculationInput,
) -> ZakatCalculationResult:
    ...

# ❌ SALAH
def calculate_zakat(saldo, stok, hutang, emas):  # Tanpa type hint
    ...
```

#### 2.2.4 Struktur Service Layer

Semua business logic HARUS berada di `services/`, bukan di `routers/`:

```python
# ✅ BENAR — router tipis, service tebal

# routers/transactions.py
@router.post("/transactions/import", status_code=202)
async def import_transactions(
    file: UploadFile,
    toko_id: str,
    current_user: User = Depends(get_current_user),
    transaction_service: TransactionService = Depends(),
) -> ImportJobResponse:
    """Terima file upload dan delegasikan ke service layer."""
    return await transaction_service.create_import_job(
        file=file,
        toko_id=toko_id,
        requested_by=current_user.id,
    )

# ❌ SALAH — logic di router
@router.post("/transactions/import")
async def import_transactions(file: UploadFile):
    # Jangan taruh 50 baris logic di sini
    content = await file.read()
    rows = parse_csv(content)
    for row in rows:
        db.add(Transaction(**row))
    await db.commit()
    ...
```

#### 2.2.5 Error Handling

```python
# Gunakan custom exception classes
class TransactionImportError(Exception):
    def __init__(self, message: str, job_id: str):
        self.message = message
        self.job_id = job_id
        super().__init__(message)

class OCRConfidenceTooLowError(Exception):
    def __init__(self, confidence: float, threshold: float):
        self.confidence = confidence
        self.threshold = threshold
        super().__init__(
            f"OCR confidence {confidence:.2f} di bawah threshold {threshold:.2f}"
        )

# Gunakan HTTPException dengan kode dan message yang konsisten
from fastapi import HTTPException

async def get_transaction(order_id: str, toko_id: str) -> Transaction:
    transaction = await repo.find_by_order_id(order_id, toko_id)
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "TRANSACTION_NOT_FOUND",
                "message": f"Pesanan {order_id} tidak ditemukan",
            },
        )
    return transaction
```

#### 2.2.6 Async Best Practices

```python
# ✅ BENAR — gunakan async/await konsisten
async def get_dashboard_summary(toko_id: str, period: date) -> DashboardSummary:
    # Jalankan query paralel jika tidak saling bergantung
    omzet, stok_alerts, zakat_status = await asyncio.gather(
        repo.get_omzet(toko_id, period),
        repo.get_stok_alerts(toko_id),
        zakat_service.get_status(toko_id),
    )
    return DashboardSummary(omzet=omzet, stok_alerts=stok_alerts, zakat=zakat_status)

# ❌ SALAH — sequential await yang tidak perlu
async def get_dashboard_summary(toko_id: str, period: date) -> DashboardSummary:
    omzet = await repo.get_omzet(toko_id, period)       # tunggu selesai
    stok_alerts = await repo.get_stok_alerts(toko_id)   # baru mulai ini
    zakat_status = await zakat_service.get_status(toko_id)  # baru ini
```

---

### 2.3 TypeScript (Frontend — Next.js)

#### 2.3.1 Formatter & Linter

```bash
# Formatter: Prettier
prettier --write "apps/web/**/*.{ts,tsx,css}"

# Linter: ESLint (Next.js config + custom rules)
eslint apps/web --fix

# Type checker: tsc
tsc --noEmit

# .eslintrc.json (rules wajib):
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "prefer-const": "error"
  }
}
```

#### 2.3.2 Konvensi Penamaan TypeScript

```typescript
// ✅ BENAR

// Interface & Type: PascalCase
interface TransactionSummary {
  orderId: string;
  status: OrderStatus;
  totalHarga: number;
}

// Enum: PascalCase, nilai SCREAMING_SNAKE_CASE
enum OrderStatus {
  SELESAI = "SELESAI",
  DIBATALKAN = "DIBATALKAN",
  RETURN = "RETURN",
  DALAM_PENGIRIMAN = "DALAM_PENGIRIMAN",
}

// React Component: PascalCase
export function DashboardSummaryCard({ data }: DashboardSummaryCardProps) {
  return <div>...</div>;
}

// Hooks: camelCase dengan prefix "use"
function useDashboardData(tokoId: string) { ... }

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_STOCK_THRESHOLD = 5;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ❌ SALAH
const dashboardsummarycard = () => {}  // lowercase component
let data: any = fetchData();           // any type
```

#### 2.3.3 Component Structure

```typescript
// Urutan yang WAJIB diikuti dalam setiap komponen:

// 1. Imports (grouped: React → library → internal → styles)
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/cards/DashboardCard";
import { formatRupiah } from "@/lib/formatters";
import type { DashboardSummary } from "@/types/dashboard";

// 2. Types & Interfaces (khusus file ini)
interface DashboardPageProps {
  tokoId: string;
}

// 3. Component function
export function DashboardPage({ tokoId }: DashboardPageProps) {
  // 3a. Hooks (urutan: state, query, effect)
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const { data, isLoading, error } = useDashboardData(tokoId, selectedPeriod);

  // 3b. Derived values
  const returnRate = data ? (data.order.return / data.order.selesai) * 100 : 0;
  const isReturnHigh = returnRate > 5;

  // 3c. Event handlers
  const handlePeriodChange = (period: "today" | "week" | "month") => {
    setSelectedPeriod(period);
  };

  // 3d. Early returns (loading, error state)
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} />;

  // 3e. Main render
  return (
    <div className="...">
      ...
    </div>
  );
}

// 4. Sub-components kecil yang hanya dipakai di file ini
function DashboardSkeleton() { ... }
```

#### 2.3.4 Aturan `any` — DILARANG

```typescript
// ❌ DILARANG — no-explicit-any adalah error
const data: any = await fetchDashboard();
function processData(input: any) { ... }

// ✅ GUNAKAN ini sebagai gantinya:
// Opsi 1: Type yang spesifik
const data: DashboardSummary = await fetchDashboard();

// Opsi 2: unknown + type guard jika tipe tidak diketahui
function processApiResponse(input: unknown): DashboardSummary {
  if (!isDashboardSummary(input)) {
    throw new Error("Invalid response shape");
  }
  return input;
}

// Opsi 3: Generic
async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as Promise<T>;
}
```

#### 2.3.5 Format Rupiah — Gunakan Utility Terpusat

```typescript
// ✅ BENAR — selalu gunakan fungsi dari lib/formatters.ts
import { formatRupiah, formatPercent } from "@/lib/formatters";

// lib/formatters.ts
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ❌ SALAH — inline formatting tersebar di mana-mana
const display = `Rp ${value.toLocaleString()}`;  // Inkonsisten
const display2 = `Rp ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
```

---

### 2.4 Database Conventions (PostgreSQL + SQLAlchemy)

#### 2.4.1 Konvensi Penamaan Database

```sql
-- Tabel: snake_case, plural
transactions
products
stock_movements
cancellation_reasons
geographic_buyers

-- Kolom: snake_case
order_id
total_harga
created_at
updated_at

-- Index: idx_{table}_{column(s)}
CREATE INDEX idx_transactions_toko_id ON transactions(toko_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Foreign key: {table_singular}_id
toko_id REFERENCES tokos(id)
product_id REFERENCES products(id)

-- Constraint: {type}_{table}_{column}
CONSTRAINT chk_transactions_status
  CHECK (status IN ('SELESAI', 'DIBATALKAN', 'RETURN', 'DALAM_PENGIRIMAN'))
```

#### 2.4.2 Kolom Wajib di Setiap Tabel

```python
# Base model yang harus di-inherit semua tabel
class TimestampMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
```

#### 2.4.3 Migration Rules

```bash
# WAJIB — setiap perubahan schema melalui Alembic
alembic revision --autogenerate -m "add_return_reason_column_to_transactions"

# Konvensi nama migration:
# {action}_{detail}
# Contoh:
# add_province_column_to_transactions
# create_stock_movements_table
# add_index_transactions_status

# ❌ DILARANG — JANGAN pernah edit schema langsung di production database
# ❌ DILARANG — JANGAN jalankan ALTER TABLE manual tanpa Alembic

# Setiap migration harus punya downgrade yang valid:
def downgrade() -> None:
    op.drop_column("transactions", "return_reason")
    # Jangan biarkan downgrade kosong kecuali ada alasan yang sangat kuat
```

---

### 2.5 Komentar & Dokumentasi Kode

#### 2.5.1 Kapan Harus Berkomentar

```python
# ✅ PERLU komentar: menjelaskan MENGAPA, bukan APA
# Gunakan Decimal bukan float untuk perhitungan keuangan
# agar menghindari floating point precision error pada kalkulasi zakat
harta_wajib_zakat = Decimal(str(saldo)) + Decimal(str(nilai_stok)) - Decimal(str(hutang))

# ✅ PERLU komentar: logic bisnis yang tidak obvious
# Pesanan RETURN tidak mengurangi stok secara otomatis
# karena barang perlu dicek kondisinya terlebih dahulu (F-07)
if transaction.status == OrderStatus.RETURN:
    await stock_service.queue_return_inspection(transaction.product_id)

# ❌ TIDAK perlu komentar: kode sudah self-explanatory
user_count = len(users)  # menghitung jumlah user — HAPUS komentar ini
```

#### 2.5.2 Docstring Wajib untuk Public Functions

```python
async def calculate_zakat(
    input_data: ZakatCalculationInput,
) -> ZakatCalculationResult:
    """
    Menghitung kewajiban zakat mal berdasarkan data keuangan toko.

    Formula:
        Harta Wajib Zakat = Uang Tunai + Nilai Stok - Hutang Jangka Pendek
        Kewajiban Zakat = 2.5% dari Harta Wajib Zakat (jika >= nishab)

    Args:
        input_data: Data keuangan termasuk saldo, nilai stok, hutang,
                    dan harga emas untuk menentukan nishab.

    Returns:
        ZakatCalculationResult dengan status nishab dan nominal zakat.

    Raises:
        GoldPriceUnavailableError: Jika API harga emas tidak dapat diakses
                                   dan cache sudah expired.

    Reference:
        AI_SPEC.md > PROMPT-SYARIAH-001
        PRD F-22, F-23, F-24, F-25
    """
```

---

### 2.6 Hal-hal yang DILARANG (Anti-Patterns)

```python
# ❌ DILARANG: Menyimpan secret/credential di kode
API_KEY = "sk-ant-xxxxxxxxxxxx"  # JANGAN! Gunakan environment variable

# ❌ DILARANG: Bare except
try:
    result = await ai_service.generate(prompt)
except:  # Tangkap semua error tanpa log = bahaya
    pass

# ❌ DILARANG: print() untuk debugging di production code
print("DEBUG:", transaction)  # Gunakan logger

# ❌ DILARANG: Blocking I/O di async function
async def get_data():
    time.sleep(1)  # Ini blok event loop! Gunakan await asyncio.sleep(1)
    data = open("file.txt").read()  # Gunakan aiofiles

# ❌ DILARANG: N+1 Query
for transaction in transactions:
    product = await db.get(Product, transaction.product_id)  # N queries!
# Gunakan JOIN atau selectinload

# ❌ DILARANG: Magic numbers tanpa konstanta
if stock_qty < 5:  # Apa arti 5? Gunakan: DEFAULT_STOCK_ALERT_THRESHOLD
    send_alert()
```

---

## 3. GIT WORKFLOW

### 3.1 Branching Strategy (Git Flow yang Disederhanakan)

```
main ──────────────────────────────────────────────► (production)
  │
  ├── develop ───────────────────────────────────────► (staging)
  │     │
  │     ├── feature/SHOP-123-zakat-calculator
  │     ├── feature/SHOP-145-ocr-upload-flow
  │     ├── fix/SHOP-156-return-rate-calculation
  │     └── chore/SHOP-160-update-dependencies
  │
  └── hotfix/SHOP-199-critical-dashboard-crash ──► (langsung ke main + develop)
```

**Aturan Branch:**
- `main` — Production-ready. Hanya menerima merge dari `develop` atau `hotfix/*`
- `develop` — Staging. Target merge dari semua feature branch
- `feature/SHOP-[ID]-[deskripsi-singkat]` — Fitur baru, berdasarkan ID Jira/Linear
- `fix/SHOP-[ID]-[deskripsi]` — Bug fix non-kritis
- `hotfix/SHOP-[ID]-[deskripsi]` — Bug kritis yang langsung ke production
- `chore/SHOP-[ID]-[deskripsi]` — Dependency update, refactor, non-functional

**Aturan Lifetime Branch:**
- Feature branch maksimal hidup **7 hari**. Lebih dari itu, wajib rebase ke develop dan diskusi dengan Tim Lead
- Hapus branch segera setelah merge PR

---

### 3.2 Commit Message Convention (Conventional Commits)

**Format:**
```
<type>(<scope>): <deskripsi singkat dalam Bahasa Inggris>

[optional body: penjelasan lebih detail jika diperlukan]

[optional footer: referensi issue / breaking change]
```

**Type yang valid:**

| Type | Kapan Digunakan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Perubahan dokumentasi saja |
| `style` | Format kode (tidak mengubah logic) |
| `refactor` | Refactor tanpa menambah fitur atau fix bug |
| `test` | Menambah atau memperbaiki test |
| `chore` | Build system, dependencies, CI/CD |
| `perf` | Peningkatan performa |

**Scope yang valid untuk proyek ini:**
`auth` · `dashboard` · `transactions` · `stock` · `syariah` · `zakat` · `ocr` · `whatsapp` · `report` · `export` · `ai` · `db` · `api` · `ui`

**Contoh commit message yang BENAR:**

```bash
# ✅ BENAR
feat(zakat): implement nishab calculation with gold price API
fix(ocr): handle low confidence score below 0.70 threshold
docs(api): add response schema for /dashboard/summary endpoint
refactor(transactions): move CSV parsing logic to dedicated service
test(syariah): add unit tests for gharar flagging edge cases
chore(deps): upgrade FastAPI to 0.115.0
perf(dashboard): parallelize DB queries using asyncio.gather

# ✅ Dengan body (untuk perubahan complex)
feat(whatsapp): add automatic zakat notification alert

Implement push notification system that triggers when toko's
harta wajib zakat exceeds nishab threshold.

Notification includes:
- Current harta wajib zakat amount
- Nishab value based on today's gold price
- Calculated zakat obligation (2.5%)
- Haul start date

Refs: PRD F-25, AI_SPEC.md PROMPT-SYARIAH-001
Closes: SHOP-145

# ❌ SALAH
git commit -m "fix bug"              # Terlalu umum
git commit -m "WIP"                  # Jangan commit WIP ke shared branch
git commit -m "ubah tampilan"        # Bahasa Indonesia, tanpa type/scope
git commit -m "feat: update stuff"   # "stuff" tidak informatif
```

---

### 3.3 Pull Request (PR) Rules

#### 3.3.1 Sebelum Membuat PR

Developer wajib memastikan:

```bash
# 1. Rebase ke develop terbaru
git fetch origin
git rebase origin/develop

# 2. Semua test hijau
pytest apps/api/tests/ -v
pnpm test --filter=web

# 3. Linting bersih
ruff check . && ruff format --check .
eslint apps/web --max-warnings 0

# 4. Type check bersih
mypy apps/api/app --strict
pnpm tsc --noEmit --filter=web

# 5. Tidak ada secret/credential yang ter-commit
git log --oneline -5  # Review commit terakhir
```

#### 3.3.2 PR Template

```markdown
## 📋 Deskripsi
<!-- Apa yang berubah dan mengapa? -->

## 🎯 Jenis Perubahan
- [ ] feat: Fitur baru
- [ ] fix: Bug fix
- [ ] refactor: Refactor kode
- [ ] docs: Update dokumentasi
- [ ] chore: Dependency / CI update

## 🔗 Referensi
- Jira/Linear: SHOP-XXX
- PRD Section: F-XX
- AI_SPEC: (jika terkait)

## ✅ Checklist Sebelum Review
- [ ] Self-review sudah dilakukan
- [ ] Unit test ditambahkan / diupdate
- [ ] Integration test berjalan
- [ ] Tidak ada `console.log` / `print()` debug yang tertinggal
- [ ] Tidak ada `any` type baru (TypeScript)
- [ ] Migration Alembic sudah dibuat (jika ada perubahan schema)
- [ ] Environment variable baru sudah ditambahkan ke `.env.example`

## 🖼️ Screenshot / Demo (jika ada perubahan UI)
<!-- Tempel screenshot atau rekaman pendek -->

## 📝 Catatan untuk Reviewer
<!-- Hal spesifik yang ingin di-highlight atau pertanyaan -->
```

#### 3.3.3 Code Review Rules

**Bagi Author:**
- PR maksimal **400 baris changed** (kecuali auto-generated). Lebih dari itu, pecah jadi beberapa PR
- Respond semua komentar reviewer sebelum request re-review
- Jangan merge sendiri — tunggu approval

**Bagi Reviewer:**
- Review dalam **1 hari kerja** (SLA internal)
- Gunakan prefix pada komentar:
  - `[BLOCKER]` — Harus diubah sebelum merge
  - `[SUGGEST]` — Saran, boleh diabaikan dengan alasan
  - `[QUESTION]` — Klarifikasi, tidak harus diubah
  - `[NITPICK]` — Minor style issue, author bisa abaikan
- Approve hanya jika semua `[BLOCKER]` sudah resolved

**Approval Requirement:**
- Feature / fix: **1 approval** (dari developer lain)
- Perubahan schema database: **2 approvals** (termasuk Tech Lead)
- Perubahan AI prompt: **2 approvals** (Tech Lead + AI Engineer)
- Merge ke `main`: **Tech Lead approval**

---

### 3.4 Tagging & Release

```bash
# Format tag: vMAJOR.MINOR.PATCH (Semantic Versioning)
# v1.0.0 — Release pertama
# v1.1.0 — Fitur baru (minor)
# v1.1.1 — Bug fix (patch)
# v2.0.0 — Breaking change (major)

# Membuat release tag
git tag -a v1.2.0 -m "Release v1.2.0: Add WhatsApp Bot Flow + Zakat Calculator"
git push origin v1.2.0

# Tag selalu dibuat dari branch main, SETELAH merge
```

---

### 3.5 Git Hooks (Otomatis via Husky)

```json
// package.json root
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint --edit $1",
      "pre-push": "pnpm test --filter affected"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.py": ["ruff format", "ruff check --fix"]
  }
}
```

Hook akan **memblokir commit** jika:
- Ada linting error
- Format commit message tidak sesuai Conventional Commits
- Test gagal (pre-push)

---

## 4. TESTING STRATEGY

### 4.1 Piramida Testing

```
           ▲
          /E2E\          ← Sedikit, lambat, mahal
         /─────\           Playwright: critical user flows
        / Integ \        ← Sedang
       /─────────\         FastAPI TestClient: API endpoints
      /    Unit    \     ← Banyak, cepat, murah
     /─────────────\      pytest + Jest: semua business logic
```

**Target Coverage:**
| Layer | Target Coverage | Tool |
|---|---|---|
| Unit (Python services) | ≥ 85% | pytest + pytest-cov |
| Unit (TypeScript utils) | ≥ 80% | Jest / Vitest |
| Integration (API) | ≥ 70% endpoint coverage | FastAPI TestClient |
| E2E (critical flows) | 100% happy path, 80% error path | Playwright |

---

### 4.2 Unit Testing — Python

#### 4.2.1 Setup

```bash
# Jalankan semua test
pytest apps/api/tests/ -v

# Dengan coverage report
pytest apps/api/tests/ --cov=app --cov-report=html --cov-fail-under=85

# Jalankan test file spesifik
pytest apps/api/tests/services/test_zakat_service.py -v

# Jalankan test dengan keyword
pytest -k "zakat" -v
```

#### 4.2.2 Struktur Test File

```python
# tests/services/test_zakat_service.py

import pytest
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from app.services.zakat_service import ZakatService
from app.schemas.zakat import ZakatCalculationInput


class TestZakatService:
    """Test suite untuk ZakatService."""

    @pytest.fixture
    def service(self):
        return ZakatService()

    @pytest.fixture
    def base_input(self) -> ZakatCalculationInput:
        """Input standar untuk test — harta DI ATAS nishab."""
        return ZakatCalculationInput(
            saldo=Decimal("100_000_000"),
            nilai_stok=Decimal("50_000_000"),
            hutang_jangka_pendek=Decimal("8_000_000"),
            harga_emas_per_gram=Decimal("1_470_000"),
            tanggal_haul_mulai=date.today() - timedelta(days=400),  # Haul sudah terpenuhi
        )

    @pytest.mark.asyncio
    async def test_calculate_zakat_above_nishab(self, service, base_input):
        """Harta di atas nishab → kewajiban zakat 2.5%."""
        with patch.object(service, "_get_gold_price", return_value=Decimal("1_470_000")):
            result = await service.calculate_zakat(base_input)

        # Nishab = 85gr × 1.470.000 = 124.950.000
        # Harta = 100.000.000 + 50.000.000 - 8.000.000 = 142.000.000
        assert result.status_nishab == "TERCAPAI"
        assert result.haul_terpenuhi is True
        assert result.harta_wajib_zakat == Decimal("142_000_000")
        assert result.kewajiban_zakat_rp == Decimal("3_550_000")  # 2.5% × 142jt

    @pytest.mark.asyncio
    async def test_calculate_zakat_below_nishab(self, service):
        """Harta di bawah nishab → tidak ada kewajiban zakat."""
        input_data = ZakatCalculationInput(
            saldo=Decimal("50_000_000"),
            nilai_stok=Decimal("20_000_000"),
            hutang_jangka_pendek=Decimal("5_000_000"),
            harga_emas_per_gram=Decimal("1_470_000"),
            tanggal_haul_mulai=date.today() - timedelta(days=400),
        )

        with patch.object(service, "_get_gold_price", return_value=Decimal("1_470_000")):
            result = await service.calculate_zakat(input_data)

        # Harta = 65.000.000 < Nishab 124.950.000
        assert result.status_nishab == "BELUM_TERCAPAI"
        assert result.kewajiban_zakat_rp is None

    @pytest.mark.asyncio
    async def test_calculate_zakat_haul_not_fulfilled(self, service, base_input):
        """Haul belum terpenuhi → tidak ada kewajiban meski harta di atas nishab."""
        base_input.tanggal_haul_mulai = date.today() - timedelta(days=100)  # Baru 100 hari

        with patch.object(service, "_get_gold_price", return_value=Decimal("1_470_000")):
            result = await service.calculate_zakat(base_input)

        assert result.haul_terpenuhi is False
        assert result.kewajiban_zakat_rp is None

    @pytest.mark.asyncio
    async def test_calculate_zakat_gold_api_failure_uses_cache(self, service, base_input):
        """Jika Gold API gagal, gunakan harga cache terakhir."""
        with patch.object(service, "_get_gold_price", side_effect=Exception("API down")):
            with patch.object(
                service, "_get_cached_gold_price", return_value=Decimal("1_450_000")
            ):
                result = await service.calculate_zakat(base_input)

        assert result.status_nishab is not None
        assert "cache" in result.catatan.lower()
```

---

### 4.3 Unit Testing — TypeScript

```typescript
// tests/lib/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatRupiah, formatPercent } from "@/lib/formatters";

describe("formatRupiah", () => {
  it("formats positive integer correctly", () => {
    expect(formatRupiah(4200000)).toBe("Rp\u00A04.200.000");
  });

  it("formats zero correctly", () => {
    expect(formatRupiah(0)).toBe("Rp\u00A00");
  });

  it("formats large amount correctly", () => {
    expect(formatRupiah(142000000)).toBe("Rp\u00A0142.000.000");
  });
});

describe("formatPercent", () => {
  it("rounds to 1 decimal by default", () => {
    expect(formatPercent(5.263)).toBe("5.3%");
  });

  it("respects custom decimal places", () => {
    expect(formatPercent(5.263, 2)).toBe("5.26%");
  });
});
```

---

### 4.4 Integration Testing — API Endpoints

```python
# tests/integration/test_dashboard_api.py
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_get_dashboard_summary_success(
    async_client: AsyncClient,
    auth_headers: dict,
    seeded_toko: str,
):
    """GET /dashboard/summary returns correct aggregated data."""
    response = await async_client.get(
        f"/v1/dashboard/summary?toko_id={seeded_toko}&period=today",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert "omzet_kotor" in data
    assert "order" in data
    assert data["order"]["return_rate_persen"] >= 0
    assert data["syariah"]["flag_gharar"] is False


@pytest.mark.asyncio
async def test_get_dashboard_summary_unauthorized(async_client: AsyncClient):
    """Tanpa token → 401 Unauthorized."""
    response = await async_client.get("/v1/dashboard/summary?toko_id=TOKO-001")
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH_EXPIRED"


@pytest.mark.asyncio
async def test_import_transactions_csv_success(
    async_client: AsyncClient,
    auth_headers: dict,
    sample_shopee_csv: bytes,
):
    """Upload CSV valid → 202 Accepted dengan job_id."""
    response = await async_client.post(
        "/v1/transactions/import",
        headers=auth_headers,
        files={"file": ("laporan.csv", sample_shopee_csv, "text/csv")},
        data={"toko_id": "TOKO-001", "source_type": "SHOPEE_CSV"},
    )

    assert response.status_code == 202
    body = response.json()
    assert "job_id" in body
    assert body["status"] == "processing"
```

---

### 4.5 E2E Testing — Playwright

**Prioritas E2E Test (harus ada sebelum go-live):**

```typescript
// tests/e2e/critical-flows.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Critical User Flows", () => {
  test("seller can view dashboard summary after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "test@toko.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="omzet-kotor"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible();
  });

  test("stock alert shows red indicator for out-of-stock product", async ({ page }) => {
    // Setup: seed product dengan stok 0
    await page.goto("/dashboard/stok");
    const outOfStockBadge = page.locator('[data-testid="stock-badge-habis"]').first();
    await expect(outOfStockBadge).toHaveClass(/bg-red/);
  });

  test("user can upload screenshot and see transaction added", async ({ page }) => {
    await page.goto("/dashboard/transaksi/upload");
    await page.setInputFiles('input[type="file"]', "tests/fixtures/shopee-screenshot.png");
    await page.click('[data-testid="upload-submit"]');

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test("zakat notification appears when nishab is reached", async ({ page }) => {
    // Setup: seed data dengan harta di atas nishab
    await page.goto("/dashboard/syariah");
    await expect(page.locator('[data-testid="zakat-alert"]')).toContainText("Nishab");
    await expect(page.locator('[data-testid="zakat-amount"]')).toBeVisible();
  });

  test("export generates downloadable XLSX file", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.goto("/dashboard/laporan");
    await page.click('[data-testid="export-xlsx"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });
});
```

---

### 4.6 AI Prompt Testing

Prompt di AI Prompt Registry wajib diuji dengan **snapshot testing** sebelum deploy ke production:

```python
# tests/ai/test_prompt_registry.py

FINANCE_001_TEST_CASES = [
    {
        "id": "TC-001: Normal growth scenario",
        "variables": {
            "OMZET_HARI_INI": "4200000",
            "OMZET_KEMARIN": "3650000",
            # ... semua variabel
        },
        "assertions": [
            "contains_percentage_change",   # Ada angka persentase
            "contains_saran",               # Ada kata "Saran:"
            "word_count_between_80_200",    # Panjang output wajar
            "no_unfilled_placeholder",      # Tidak ada {{VAR}} yang tersisa
        ],
    },
    {
        "id": "TC-002: Zero sales day",
        "variables": {
            "OMZET_HARI_INI": "0",
            "ORDER_SELESAI": "0",
            # ...
        },
        "assertions": [
            "does_not_crash",
            "word_count_between_80_200",
        ],
    },
]

@pytest.mark.asyncio
@pytest.mark.ai_test  # Tandai sebagai AI test, bisa skip di CI cepat
async def test_finance_001_prompt(ai_service):
    for tc in FINANCE_001_TEST_CASES:
        result = await ai_service.generate("PROMPT-FINANCE-001", tc["variables"])
        for assertion in tc["assertions"]:
            assert_prompt_output(result, assertion), f"Failed: {tc['id']} - {assertion}"
```

---

## 5. DEPLOYMENT GUIDE

### 5.1 Environment Overview

| Environment | Branch | URL | Tujuan |
|---|---|---|---|
| **Development** | Local | localhost:3000 / :8000 | Developer testing |
| **Staging** | `develop` | staging.laporan-shopee.id | QA & UAT testing |
| **Production** | `main` | app.laporan-shopee.id | End users |

---

### 5.2 Environment Variables

Semua environment variables dikelola di file `.env` (local) atau secret manager (staging/prod).

```bash
# .env.example — WAJIB diupdate saat ada variable baru
# Salin ke .env dan isi dengan nilai aktual

# === APPLICATION ===
APP_ENV=development          # development | staging | production
APP_SECRET_KEY=              # Random 32-char string (gunakan: openssl rand -hex 32)
DEBUG=true                   # false di production

# === DATABASE ===
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/shopee_laporan
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# === REDIS ===
REDIS_URL=redis://localhost:6379/0
REDIS_SESSION_DB=1           # DB terpisah untuk session

# === AI / CLAUDE ===
ANTHROPIC_API_KEY=           # RAHASIA — Jangan commit!
ANTHROPIC_MODEL=claude-sonnet-4-20250514
AI_TIMEOUT_SECONDS=15
AI_MAX_RETRIES=3

# === EXTERNAL APIs ===
GOLD_PRICE_API_KEY=          # RAHASIA
GOLD_PRICE_API_URL=https://api.harga-emas.id/v1
GOLD_PRICE_CACHE_TTL_SECONDS=3600

# === WHATSAPP ===
TWILIO_ACCOUNT_SID=          # RAHASIA
TWILIO_AUTH_TOKEN=           # RAHASIA
TWILIO_WA_NUMBER=whatsapp:+628XXXXXXXXXX

# === STORAGE ===
AWS_ACCESS_KEY_ID=           # RAHASIA
AWS_SECRET_ACCESS_KEY=       # RAHASIA
AWS_S3_BUCKET=shopee-laporan-files
AWS_REGION=ap-southeast-1

# === MONITORING ===
SENTRY_DSN=                  # RAHASIA
```

**Pengelolaan Secret:**
- Development: `.env` lokal (di-gitignore)
- Staging/Production: **AWS Secrets Manager** atau **GitHub Secrets**
- JANGAN PERNAH commit `.env` yang berisi nilai aktual ke repository
- Rotasi API key setiap 90 hari

---

### 5.3 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/org/shopee-laporan.git
cd shopee-laporan

# 2. Copy environment template
cp .env.example .env
# Edit .env dengan nilai lokal Anda

# 3. Install dependencies
pnpm install                    # Frontend (Node packages)
pip install -r requirements.txt # Backend (Python packages)
# atau gunakan:
pip install -e ".[dev]"

# 4. Jalankan infrastruktur lokal (PostgreSQL + Redis)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Jalankan database migration
cd apps/api
alembic upgrade head

# 6. Seed data development
python scripts/seed_dev_data.py

# 7. Jalankan semua service
# Terminal 1 — Backend:
cd apps/api && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery Worker:
cd apps/api && celery -A app.workers.celery_app worker --loglevel=info

# Terminal 3 — Frontend:
cd apps/web && pnpm dev

# 8. Akses aplikasi
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
# Celery Monitor: http://localhost:5555 (Flower)
```

---

### 5.4 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: "20" }
      - name: Install dependencies
        run: |
          pip install -e ".[dev]"
          pnpm install
      - name: Python lint
        run: ruff check . && ruff format --check .
      - name: Python type check
        run: mypy apps/api/app --strict
      - name: TypeScript lint
        run: pnpm eslint apps/web --max-warnings 0
      - name: TypeScript type check
        run: pnpm tsc --noEmit --filter=web

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: shopee_laporan_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: pytest apps/api/tests/ --cov=app --cov-report=xml --cov-fail-under=85
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:testpassword@localhost:5432/shopee_laporan_test
          REDIS_URL: redis://localhost:6379/0
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}
      - name: Upload coverage report
        uses: codecov/codecov-action@v4

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run frontend unit tests
        run: pnpm test --filter=web -- --coverage

  e2e:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Start application stack
        run: docker-compose -f infrastructure/docker/docker-compose.yml up -d
      - name: Wait for services
        run: sleep 30
      - name: Run Playwright E2E tests
        run: pnpm playwright test
      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

### 5.5 Deployment ke Staging

Deployment ke staging terjadi **otomatis** setiap push ke branch `develop` (jika CI hijau):

```yaml
# .github/workflows/cd-staging.yml

name: CD - Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test-backend, test-frontend, e2e]
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: |
          docker build -t shopee-laporan-api:${{ github.sha }} -f infrastructure/docker/Dockerfiles/api.Dockerfile .
          docker build -t shopee-laporan-web:${{ github.sha }} -f infrastructure/docker/Dockerfiles/web.Dockerfile .

      - name: Push to Container Registry
        run: |
          docker push ghcr.io/org/shopee-laporan-api:${{ github.sha }}
          docker push ghcr.io/org/shopee-laporan-web:${{ github.sha }}

      - name: Deploy to Staging (K8s)
        run: |
          kubectl set image deployment/api api=ghcr.io/org/shopee-laporan-api:${{ github.sha }} -n staging
          kubectl set image deployment/web web=ghcr.io/org/shopee-laporan-web:${{ github.sha }} -n staging
          kubectl rollout status deployment/api -n staging --timeout=120s
          kubectl rollout status deployment/web -n staging --timeout=120s

      - name: Run database migrations on staging
        run: kubectl exec -n staging deployment/api -- alembic upgrade head

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "Staging deploy: ${{ github.sha }} — ${{ job.status }}"
```

---

### 5.6 Deployment ke Production

Deployment production **tidak otomatis** — harus dipicu **manual** oleh Tech Lead:

```yaml
# .github/workflows/cd-production.yml

name: CD - Production

on:
  workflow_dispatch:              # Manual trigger ONLY
    inputs:
      version_tag:
        description: "Version tag to deploy (e.g. v1.2.0)"
        required: true
      confirm:
        description: 'Type "DEPLOY" to confirm'
        required: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate confirmation
        if: github.event.inputs.confirm != 'DEPLOY'
        run: echo "Confirmation invalid. Aborting." && exit 1

  deploy-production:
    runs-on: ubuntu-latest
    needs: [validate]
    environment: production       # Requires GitHub environment protection rules
    steps:
      - name: Deploy to Production (K8s)
        run: |
          IMAGE_TAG=${{ github.event.inputs.version_tag }}
          kubectl set image deployment/api api=ghcr.io/org/shopee-laporan-api:$IMAGE_TAG -n production
          kubectl set image deployment/web web=ghcr.io/org/shopee-laporan-web:$IMAGE_TAG -n production
          kubectl rollout status deployment/api -n production --timeout=300s

      - name: Run smoke tests
        run: python scripts/smoke_test_production.py

      - name: Create Sentry release
        run: sentry-cli releases new ${{ github.event.inputs.version_tag }}

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          text: "🚀 Production deployed: ${{ github.event.inputs.version_tag }}"
```

---

### 5.7 Rollback Procedure

Jika terjadi masalah di production setelah deployment:

```bash
# OPSI 1 — Rollback Kubernetes (cepat, dalam hitungan detik)
kubectl rollout undo deployment/api -n production
kubectl rollout undo deployment/web -n production
kubectl rollout status deployment/api -n production

# OPSI 2 — Deploy ulang versi sebelumnya (lebih terkontrol)
# Trigger workflow cd-production.yml dengan version_tag versi sebelumnya
# Contoh: jika v1.2.0 bermasalah, deploy ulang v1.1.2

# OPSI 3 — Database rollback (jika ada migration yang bermasalah)
# HATI-HATI: Downgrade migration bisa menyebabkan data loss
# Konsultasi dengan Tech Lead dan DBA sebelum menjalankan
kubectl exec -n production deployment/api -- alembic downgrade -1

# SLA Rollback:
# - Masalah terdeteksi → keputusan rollback: maksimal 15 menit
# - Rollback selesai: maksimal 10 menit setelah keputusan
```

---

### 5.8 Health Checks & Monitoring

```python
# Endpoint wajib ada di production
# GET /health — liveness probe
# GET /health/ready — readiness probe

@router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        redis_ok = await redis_client.ping()
        return {
            "status": "ready",
            "database": "ok",
            "redis": "ok" if redis_ok else "degraded",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
```

**Alert yang harus dikonfigurasi di Grafana/PagerDuty:**

| Alert | Threshold | Severity |
|---|---|---|
| API error rate > 1% | 5 menit berturut-turut | HIGH |
| API p95 latency > 3 detik | 5 menit berturut-turut | MEDIUM |
| Celery queue depth > 100 jobs | — | MEDIUM |
| Database connection pool > 80% | — | HIGH |
| AI API error rate > 5% | 10 menit berturut-turut | MEDIUM |
| Disk usage > 80% | — | HIGH |
| Memory usage > 85% | — | HIGH |

---

## 6. ONBOARDING DEVELOPER BARU

### 6.1 Checklist Hari Pertama

```
☐ Akses GitHub repository (minta ke Tech Lead)
☐ Akses Jira/Linear project board
☐ Akses Slack channel: #dev-shopee-laporan, #alerts-production
☐ Undang ke Google Workspace / email kantor
☐ Baca PRD_App_Laporan_Penjualan_Shopee.md (wajib, ~30 menit)
☐ Baca AI_SPEC.md (wajib, ~45 menit)
☐ Baca DEV_GUIDE.md ini (wajib, ~60 menit)
☐ Setup local development environment (Seksi 5.3)
☐ Jalankan semua test, pastikan hijau
☐ Minta Tech Lead untuk pair programming session pertama
```

### 6.2 Pertanyaan Umum

**Q: Saya harus mulai dari mana?**  
A: Baca PRD, lalu AI_SPEC, lalu DEV_GUIDE. Setup lokal. Minta tiket "good first issue" ke Tech Lead.

**Q: Boleh saya push langsung ke `develop`?**  
A: Tidak. Semua perubahan harus melalui PR dan mendapat minimal 1 approval.

**Q: Boleh saya menggunakan library baru?**  
A: Ajukan di PR atau diskusi di Slack terlebih dahulu. Library baru harus disetujui Tech Lead sebelum di-merge.

**Q: Bagaimana jika saya tidak yakin apakah harus menulis test untuk sesuatu?**  
A: Default: tulis test. Jika ragu, tanya Tech Lead. "Kode tanpa test adalah kode yang belum selesai."

**Q: Bagaimana jika saya menemukan bug di production?**  
A: Segera lapor di Slack channel #alerts-production. Jangan langsung hotfix sendiri tanpa koordinasi.

---

## LAMPIRAN A: Perintah Harian Berguna

```bash
# === DEVELOPMENT ===
# Start semua service lokal
docker-compose up -d && uvicorn app.main:app --reload & pnpm dev

# Buat migration baru
alembic revision --autogenerate -m "deskripsi_perubahan"

# Apply migration
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# === TESTING ===
# Semua test
pytest apps/api/tests/ -v

# Hanya unit test (skip integration)
pytest apps/api/tests/unit/ -v

# Test dengan coverage
pytest --cov=app --cov-report=html

# Buka coverage report
open htmlcov/index.html

# Frontend test
pnpm test --filter=web

# E2E Playwright
pnpm playwright test
pnpm playwright test --ui    # Mode interaktif

# === GIT ===
# Update branch dari develop terbaru
git fetch origin && git rebase origin/develop

# Lihat semua branch aktif
git branch -a

# === LINTING ===
ruff check . --fix && ruff format .
eslint apps/web --fix
mypy apps/api/app --strict

# === DATABASE ===
# Masuk ke PostgreSQL lokal
psql -U postgres -d shopee_laporan

# Reset database lokal (hati-hati!)
alembic downgrade base && alembic upgrade head && python scripts/seed_dev_data.py

# === DOCKER ===
# Rebuild image setelah perubahan dependency
docker-compose build --no-cache api

# Lihat logs
docker-compose logs -f api
docker-compose logs -f celery-worker
```

---

## LAMPIRAN B: Referensi Dokumentasi

| Dokumen | Lokasi | Audience |
|---|---|---|
| PRD Aplikasi | `docs/PRD_App_Laporan_Penjualan_Shopee.md` | Semua tim |
| AI Spec (Prompt Registry, OCR, WhatsApp, Contracts) | `docs/AI_SPEC.md` | Developer, AI Engineer |
| DEV Guide (dokumen ini) | `docs/DEV_GUIDE.md` | Developer |
| API Documentation (auto-generated) | `http://localhost:8000/docs` | Developer |
| Database Schema | `apps/api/migrations/` | Backend Developer |

---

*Dokumen ini adalah living document. Jika ada yang kurang atau tidak akurat, buat PR untuk update langsung. Tidak perlu menunggu persetujuan untuk perbaikan dokumentasi.*

*Last updated: 4 Mei 2026*
