# SECURITY.md
## Panduan Keamanan, Respons Insiden & Operasional Sistem
### Aplikasi Laporan Penjualan Shopee

---

**Versi Dokumen:** 1.0  
**Tanggal:** 4 Mei 2026  
**Penulis:** DevOps Engineer / Security Engineer  
**Referensi:** PRD v1.0 · AI_SPEC.md v1.0 · DEV_GUIDE.md v1.0  
**Audience:** Developer · DevOps Engineer · Tech Lead · On-Call Engineer  
**Klasifikasi:** INTERNAL — CONFIDENTIAL  
**Status:** Living Document

---

> ⚠️ **DOKUMEN INI SENSITIF**  
> Jangan bagikan di luar tim engineering. Jangan commit credential, IP address production,  
> atau konfigurasi firewall yang spesifik ke repository publik.

---

## DAFTAR ISI

1. [Security Architecture & Hardening](#1-security-architecture--hardening)
2. [Incident Response](#2-incident-response)
3. [Backup & Recovery](#3-backup--recovery)
4. [Monitoring & Alerting](#4-monitoring--alerting)
5. [Runbook Operasional](#5-runbook-operasional)
6. [Compliance & Audit](#6-compliance--audit)

---

## 1. SECURITY ARCHITECTURE & HARDENING

### 1.1 Model Ancaman (Threat Model)

Sebelum mendefinisikan kontrol keamanan, tim harus memahami aset yang dilindungi dan ancaman yang paling relevan.

**Aset Kritis:**

| Aset | Nilai Bisnis | Dampak Jika Bocor |
|---|---|---|
| Data transaksi penjualan | SANGAT TINGGI | Kerugian reputasi, potensi gugatan |
| Data keuangan & laba toko | SANGAT TINGGI | Keunggulan kompetitif hilang |
| Data pribadi pembeli (nama, kota) | TINGGI | Pelanggaran UU PDP No. 27/2022 |
| API Key Claude / Anthropic | TINGGI | Penyalahgunaan biaya AI |
| API Key Twilio / WhatsApp | TINGGI | Spam, penipuan via nomor toko |
| Kredensial database | KRITIS | Eksfiltrasi seluruh data |
| JWT secret key | KRITIS | Akses tidak sah ke semua akun |

**Threat Actors:**

| Aktor | Motivasi | Vektor Serangan Utama |
|---|---|---|
| Penyerang eksternal | Finansial, data | SQL injection, credential stuffing, API abuse |
| Insider threat | Dendam, finansial | Akses langsung DB, eksfiltrasi data |
| Bot otomatis | Spam, scraping | Brute force, rate limit bypass |
| Kompetitor | Intelijen bisnis | Akses tidak sah ke laporan |

---

### 1.2 Defense in Depth — Lapisan Keamanan

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 7 — APLIKASI                                                 │
│  Input validation · Output encoding · CSRF protection              │
│  Prompt injection prevention · Business logic validation           │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 6 — AUTENTIKASI & OTORISASI                                  │
│  JWT RS256 · RBAC · Session management · MFA (roadmap)             │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 5 — API GATEWAY                                              │
│  Rate limiting · WAF rules · DDoS protection · TLS 1.3 only        │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — JARINGAN                                                 │
│  VPC private subnet · Security Groups · Network ACL                │
│  Zero-trust inter-service communication                             │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — CONTAINER & RUNTIME                                      │
│  Non-root user · Read-only filesystem · Seccomp profiles           │
│  Image scanning (Trivy) · No privileged containers                 │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — DATA                                                     │
│  Encryption at rest (AES-256) · Encryption in transit (TLS)        │
│  Column-level encryption untuk PII · Backup encryption             │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — INFRASTRUKTUR                                            │
│  MFA untuk cloud console · Least privilege IAM · Audit logs        │
│  Patch management · Bastion host untuk akses SSH                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Autentikasi & Otorisasi

#### 1.3.1 JWT Configuration

```python
# config/security.py

JWT_ALGORITHM = "RS256"           # Asymmetric — BUKAN HS256
JWT_ACCESS_TOKEN_TTL = 8 * 3600  # 8 jam
JWT_REFRESH_TOKEN_TTL = 30 * 86400  # 30 hari
JWT_ISSUER = "laporan-shopee.id"
JWT_AUDIENCE = ["laporan-shopee-api", "laporan-shopee-web"]

# Private key disimpan di AWS Secrets Manager, BUKAN di .env
# Public key didistribusikan via JWKS endpoint: GET /.well-known/jwks.json

# ❌ DILARANG: HS256 dengan shared secret
# JWT_ALGORITHM = "HS256"
# JWT_SECRET = "my-secret-key"  # Rentan jika secret bocor
```

#### 1.3.2 RBAC (Role-Based Access Control)

```python
# Definisi roles dan permissions

ROLES = {
    "OWNER": {
        "description": "Pemilik toko — akses penuh ke semua fitur tokonya",
        "permissions": [
            "dashboard:read",
            "transactions:read",
            "transactions:import",
            "reports:read",
            "reports:export",
            "syariah:read",
            "stock:read",
            "stock:write",
            "whatsapp:manage",
            "settings:write",
        ],
    },
    "STAFF": {
        "description": "Staf toko — akses terbatas, tidak bisa export dan setting",
        "permissions": [
            "dashboard:read",
            "transactions:read",
            "transactions:import",
            "reports:read",
            "stock:read",
            "stock:write",
        ],
    },
    "ACCOUNTANT": {
        "description": "Pengelola keuangan — akses laporan dan zakat, read-only",
        "permissions": [
            "dashboard:read",
            "reports:read",
            "reports:export",
            "syariah:read",
        ],
    },
    "SUPER_ADMIN": {
        "description": "Admin platform — akses lintas toko (SANGAT TERBATAS)",
        "permissions": ["admin:*"],
        "requires_mfa": True,
        "ip_whitelist": True,   # Hanya dari IP kantor
    },
}

# Implementasi di FastAPI:
from functools import wraps

def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if permission not in current_user.role.permissions:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "code": "FORBIDDEN",
                        "message": f"Akses ditolak. Butuh permission: {permission}",
                    },
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Penggunaan:
@router.get("/reports/financial")
@require_permission("reports:read")
async def get_financial_report(...):
    ...
```

#### 1.3.3 Tenant Isolation (Multi-Toko)

```python
# KRITIS: Setiap query HARUS menyertakan toko_id dari token JWT
# JANGAN pernah menerima toko_id dari request body tanpa validasi

async def get_transactions(
    toko_id_from_query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Transaction]:
    # Validasi: toko_id di query HARUS cocok dengan toko_id di JWT
    if toko_id_from_query != current_user.toko_id:
        # Log sebagai security event
        await security_logger.log_tenant_violation(
            user_id=current_user.id,
            requested_toko=toko_id_from_query,
            actual_toko=current_user.toko_id,
        )
        raise HTTPException(status_code=403, detail={"code": "TENANT_VIOLATION"})

    # Selalu filter dengan toko_id dari JWT — BUKAN dari input user
    return await repo.get_transactions(toko_id=current_user.toko_id)

# ❌ PALING BERBAHAYA — JANGAN PERNAH:
# SELECT * FROM transactions WHERE id = :id
# (tanpa filter toko_id → penjual A bisa akses data penjual B)
```

---

### 1.4 Input Validation & Injection Prevention

#### 1.4.1 SQL Injection Prevention

```python
# ✅ BENAR — selalu gunakan parameterized query via SQLAlchemy ORM
result = await db.execute(
    select(Transaction)
    .where(Transaction.toko_id == toko_id)
    .where(Transaction.status == status)
    .order_by(Transaction.created_at.desc())
)

# ✅ BENAR — jika harus raw SQL, gunakan text() dengan parameter
result = await db.execute(
    text("SELECT * FROM transactions WHERE toko_id = :toko_id AND status = :status"),
    {"toko_id": toko_id, "status": status},
)

# ❌ SANGAT BERBAHAYA — string concatenation
query = f"SELECT * FROM transactions WHERE toko_id = '{toko_id}'"  # SQL INJECTION!
```

#### 1.4.2 Prompt Injection Prevention

```python
# Setiap variabel yang diinjeksi ke prompt AI HARUS disanitasi

PROMPT_INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"ignore all instructions",
    r"you are now",
    r"act as",
    r"disregard",
    r"<\s*script",
    r"system\s*:",
    r"human\s*:",
    r"\{\{.*\}\}",  # Nested template injection
]

def sanitize_prompt_variable(value: str, max_length: int = 200) -> str:
    """
    Sanitasi nilai sebelum diinjeksi ke dalam prompt AI.
    Mencegah prompt injection attacks.
    """
    if not isinstance(value, str):
        value = str(value)

    # Truncate
    value = value[:max_length]

    # Strip karakter berbahaya
    value = value.replace("\n", " ").replace("\r", " ")
    value = value.replace('"', "'").replace("`", "'")

    # Deteksi dan reject pola injection
    import re
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValueError(f"Terdeteksi pola prompt injection: {pattern}")

    return value.strip()

# Penggunaan wajib sebelum kirim ke AI:
safe_product_name = sanitize_prompt_variable(user_input_product_name)
```

#### 1.4.3 File Upload Validation

```python
# Untuk endpoint /transactions/import dan OCR upload

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "application/pdf", "text/csv",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

async def validate_upload(file: UploadFile) -> bytes:
    """Validasi file upload sebelum diproses."""

    # 1. Cek MIME type dari header (bisa dipalsukan)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, detail={"code": "INVALID_FILE_TYPE"})

    # 2. Baca konten dan cek ukuran
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(413, detail={"code": "FILE_TOO_LARGE"})

    # 3. Verifikasi magic bytes (content-based type detection)
    # Ini tidak bisa dipalsukan seperti Content-Type header
    import magic
    detected_type = magic.from_buffer(content, mime=True)
    if detected_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"File content tidak sesuai: detected {detected_type}")

    # 4. Scan antivirus (jika ClamAV tersedia)
    if settings.ENABLE_AV_SCAN:
        await scan_with_clamav(content)

    return content
```

---

### 1.5 Data Protection & Encryption

#### 1.5.1 Enkripsi Data PII

Data pribadi pembeli (mengacu UU PDP No. 27/2022) harus dienkripsi di level kolom:

```python
# models/transaction.py
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = mapped_column(UUID, primary_key=True, default=uuid4)
    toko_id = mapped_column(UUID, ForeignKey("tokos.id"), nullable=False, index=True)
    order_id = mapped_column(String(50), nullable=False, index=True)

    # Kolom NON-PII — plain text, bisa diindex dan dicari
    status = mapped_column(String(20), nullable=False, index=True)
    total_harga = mapped_column(Numeric(15, 2), nullable=False)
    provinsi_pembeli = mapped_column(String(100))   # Dipakai agregat, tidak PII
    kota_pembeli = mapped_column(String(100))

    # Kolom PII — WAJIB dienkripsi di level kolom
    nama_pembeli = mapped_column(
        EncryptedType(String, settings.COLUMN_ENCRYPTION_KEY, AesEngine, "pkcs5"),
        nullable=True,
    )

    # COLUMN_ENCRYPTION_KEY disimpan di AWS KMS, bukan di .env biasa
```

#### 1.5.2 Enkripsi Secret di Runtime

```python
# Semua secret diakses via AWS Secrets Manager, BUKAN environment variable langsung
# Kecuali di development lokal

import boto3
import json
from functools import lru_cache

@lru_cache(maxsize=1)
def get_secrets() -> dict:
    """Ambil semua secret dari AWS Secrets Manager (cached)."""
    if settings.APP_ENV == "development":
        # Development: baca dari .env
        return {
            "ANTHROPIC_API_KEY": settings.ANTHROPIC_API_KEY,
            "TWILIO_AUTH_TOKEN": settings.TWILIO_AUTH_TOKEN,
            # ...
        }

    client = boto3.client("secretsmanager", region_name="ap-southeast-1")
    response = client.get_secret_value(SecretId="shopee-laporan/production")
    return json.loads(response["SecretString"])
```

#### 1.5.3 Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],    # Argon2id — lebih kuat dari bcrypt untuk 2026
    deprecated="auto",
    argon2__memory_cost=65536,   # 64 MB
    argon2__time_cost=3,
    argon2__parallelism=4,
)

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed: str) -> bool:
    return pwd_context.verify(plain_password, hashed)

# ❌ DILARANG: MD5, SHA1, SHA256 tanpa salt, bcrypt dengan work factor < 12
```

---

### 1.6 API Security

#### 1.6.1 Rate Limiting — Per Endpoint

```nginx
# nginx/nginx.conf — Rate limiting zones

# Zone untuk login (ketat — cegah brute force)
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Zone untuk API umum
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

# Zone untuk OCR upload (berat secara komputasi)
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=20r/h;

# Zone untuk AI endpoint (biaya per-call)
limit_req_zone $binary_remote_addr zone=ai_limit:10m rate=10r/m;

server {
    location /v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        limit_req_status 429;
    }

    location /v1/transactions/import {
        limit_req zone=upload_limit burst=5;
        client_max_body_size 25M;
    }

    location /v1/ai/ {
        limit_req zone=ai_limit burst=5;
    }

    location /v1/ {
        limit_req zone=api_limit burst=20 nodelay;
    }
}
```

#### 1.6.2 Security Headers

```python
# middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        # HSTS — paksa HTTPS selama 1 tahun
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        # Cegah clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Cegah MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # CSP — sesuaikan dengan kebutuhan frontend
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'nonce-{nonce}'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.laporan-shopee.id; "
            "frame-ancestors 'none';"
        )
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        # Hapus header yang mengekspos info server
        response.headers.pop("Server", None)
        response.headers.pop("X-Powered-By", None)

        return response
```

#### 1.6.3 WhatsApp Webhook Signature Validation

```python
# Setiap request dari Twilio HARUS diverifikasi tanda tangannya
# Mencegah attacker berpura-pura menjadi Twilio

import hmac
import hashlib
from twilio.request_validator import RequestValidator

async def validate_twilio_signature(request: Request) -> None:
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)

    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    form_data = await request.form()

    if not validator.validate(url, dict(form_data), signature):
        await security_logger.log_invalid_webhook(
            source_ip=request.client.host,
            signature=signature,
        )
        raise HTTPException(
            status_code=403,
            detail={"code": "INVALID_WEBHOOK_SIGNATURE"},
        )
```

---

### 1.7 Dependency Security

```bash
# Scan dependency vulnerabilities — wajib di CI pipeline

# Python
pip-audit --vulnerability-service osv
safety check -r requirements.txt

# Node.js
pnpm audit --audit-level=high

# Container image
trivy image shopee-laporan-api:latest --exit-code 1 --severity HIGH,CRITICAL

# Kebijakan:
# - CRITICAL vulnerability → BLOCK merge, wajib fix dalam 24 jam
# - HIGH vulnerability → BLOCK merge, wajib fix dalam 7 hari
# - MEDIUM vulnerability → WARNING, masuk backlog, fix dalam 30 hari
# - LOW vulnerability → Informational, fix saat ada kesempatan
```

---

### 1.8 Secrets Scanning

```yaml
# .github/workflows/ci.yml — tambahkan job ini
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Scan seluruh history

      - name: Scan for secrets with Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Scan with TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          extra_args: --only-verified
```

**Jika secret ter-commit ke repository:**
1. JANGAN hanya delete commit atau file — history Git masih menyimpannya
2. Rotasi secret SEGERA (anggap sudah bocor)
3. Gunakan `git filter-repo` untuk hapus dari history
4. Force push ke semua branch
5. Notifikasi Tech Lead dan Security Lead

---

## 2. INCIDENT RESPONSE

### 2.1 Klasifikasi Insiden

| Level | Nama | Deskripsi | Contoh | Response Time |
|---|---|---|---|---|
| **SEV-1** | KRITIS | Sistem production down atau data breach aktif | Database tidak bisa diakses, kebocoran data massal | **15 menit** |
| **SEV-2** | TINGGI | Degradasi signifikan fitur utama | Dashboard tidak memuat, semua export gagal | **30 menit** |
| **SEV-3** | SEDANG | Fitur tertentu terganggu, ada workaround | Zakat calculator error, OCR gagal untuk format tertentu | **2 jam** |
| **SEV-4** | RENDAH | Bug minor, tidak memengaruhi operasional | Typo di notifikasi WA, format tanggal salah | **Next sprint** |

---

### 2.2 Incident Response Team

| Peran | Tanggung Jawab | Siapa |
|---|---|---|
| **Incident Commander (IC)** | Koordinasi respons, keputusan eskalasi, komunikasi stakeholder | Tech Lead (on-call) |
| **Technical Lead (TL)** | Investigasi teknis, eksekusi mitigasi | Senior Developer on-call |
| **Communications Lead (CL)** | Update status page, notifikasi user jika perlu | Product Manager |
| **Security Lead (SL)** | Terlibat jika ada indikasi breach | Security Engineer |

**On-Call Rotation:** Rotasi mingguan. Jadwal di PagerDuty. Setiap shift: 1 IC + 1 TL.

---

### 2.3 Incident Response Playbook

#### FASE 1 — DETEKSI & TRIAGE (0–15 menit)

```
TRIGGER: Alert dari Grafana/PagerDuty / Laporan user / Temuan manual
          │
          ▼
[ IC ] Acknowledge alert di PagerDuty (maks 5 menit setelah alert)
          │
          ▼
[ IC ] Buka War Room (Slack channel: #incident-YYYYMMDD-[deskripsi])
       Format nama channel: #incident-20260504-db-down
          │
          ▼
[ TL ] Akses dashboard monitoring, identifikasi scope:
       - Berapa user terdampak?
       - Fitur apa yang terpengaruh?
       - Apakah data terkompromisi?
          │
          ▼
[ IC ] Tetapkan severity level (SEV-1 s/d SEV-4)
          │
          ▼
[ IC ] Notifikasi stakeholder sesuai severity:
       SEV-1/2: Ping @channel di #dev-shopee-laporan + WhatsApp grup manajemen
       SEV-3/4: Hanya di Slack channel incident
```

#### FASE 2 — MITIGASI (15 menit – selesai)

```
[ TL ] Identifikasi root cause (lihat Runbook Seksi 5 untuk panduan spesifik)
          │
          ▼
[ IC ] Keputusan: Rollback vs Hotfix vs Accept & Monitor?
          │
     ┌────┴────────────────┐
     ▼                     ▼
ROLLBACK               HOTFIX
(< 30 menit)           (hotfix branch, CI pipeline, deploy)
     │                     │
     └──────────┬──────────┘
                ▼
[ TL ] Verifikasi mitigasi berhasil:
       - Health check endpoint: GET /health/ready → 200
       - Sample transaksi bisa dibuat
       - Dashboard memuat < 3 detik
                │
                ▼
[ IC ] Umumkan resolusi di war room channel
```

#### FASE 3 — POST-MORTEM (dalam 48 jam setelah SEV-1/2)

```markdown
# Template Post-Mortem

## Ringkasan Insiden
- **Tanggal:** YYYY-MM-DD
- **Durasi:** HH:MM – HH:MM (total X jam Y menit)
- **Severity:** SEV-X
- **IC:** [Nama]
- **TL:** [Nama]

## Timeline
| Waktu | Kejadian |
|---|---|
| 08:15 | Alert pertama masuk dari Grafana |
| 08:22 | IC acknowledge, war room dibuka |
| 08:35 | Root cause teridentifikasi: migration salah |
| 09:10 | Rollback selesai, sistem normal kembali |

## Root Cause
[Penjelasan teknis singkat apa yang menjadi penyebab]

## Dampak
- Berapa pengguna terdampak
- Berapa lama downtime
- Apakah ada data loss / corruption

## Faktor Kontribusi
- [Faktor 1]
- [Faktor 2]

## Apa yang Berjalan Baik
- [Hal baik 1]

## Apa yang Perlu Diperbaiki
- [Area perbaikan 1]

## Action Items
| Tindakan | PIC | Deadline |
|---|---|---|
| Tambah migration test di CI | Backend Dev | 1 minggu |
| Perbaiki runbook rollback | DevOps | 3 hari |

## Lessons Learned
[Pelajaran utama untuk dicegah di masa depan]
```

---

### 2.4 Security Incident — Data Breach Protocol

Jika ada indikasi data breach (unauthorized access, data exfiltration, dll.):

```
STEP 1 — CONTAIN (dalam 15 menit pertama)
├── Isolasi sistem yang terdampak (nonaktifkan sementara jika perlu)
├── Rotasi SEMUA credentials yang mungkin ter-expose:
│   ├── Database password
│   ├── JWT secret key
│   ├── API keys (Anthropic, Twilio, Gold Price API)
│   └── AWS access keys
└── Preserve evidence: JANGAN hapus log, JANGAN restart service dulu

STEP 2 — ASSESS (dalam 1 jam pertama)
├── Identifikasi: data apa yang diakses?
├── Identifikasi: berapa record yang terdampak?
├── Identifikasi: siapa saja user yang terdampak?
└── Dokumentasikan semua temuan

STEP 3 — NOTIFY (dalam 72 jam — sesuai UU PDP No. 27/2022)
├── Notifikasi internal: Manajemen, Legal, Security
├── Jika data pribadi pembeli bocor:
│   ├── Wajib lapor ke BSSN (Badan Siber dan Sandi Negara)
│   ├── Notifikasi user yang terdampak
│   └── Siapkan FAQ untuk user
└── Konsultasikan dengan tim legal untuk langkah hukum

STEP 4 — REMEDIATE
├── Fix vulnerability yang dieksploitasi
├── Patch semua sistem yang mungkin rentan
├── Audit log akses 30 hari terakhir
└── Penetration test ulang setelah fix

STEP 5 — REVIEW
└── Post-mortem khusus security, audit trail lengkap
```

---

### 2.5 Kontak Darurat

```
# Simpan di tempat yang bisa diakses offline (bukan hanya di sistem yang mungkin down)

Tech Lead         : [Nama] — WA: +62xxx — Email: xxx@xxx
Senior DevOps     : [Nama] — WA: +62xxx — Email: xxx@xxx
Security Lead     : [Nama] — WA: +62xxx — Email: xxx@xxx
Product Manager   : [Nama] — WA: +62xxx — Email: xxx@xxx
CTO               : [Nama] — WA: +62xxx (hanya SEV-1)

Vendor Support:
AWS Support       : https://console.aws.amazon.com/support  (Buka Business/Enterprise plan)
Anthropic Support : https://support.anthropic.com
Twilio Support    : https://help.twilio.com  — Phone: +1-877-379-4589
Sentry Support    : https://sentry.io/support

External Services Status:
AWS Status        : https://health.aws.amazon.com
Anthropic Status  : https://status.anthropic.com
Twilio Status     : https://status.twilio.com
```

---

## 3. BACKUP & RECOVERY

### 3.1 Strategi Backup — Overview

**RPO (Recovery Point Objective):** Maksimal kehilangan data **1 jam**  
**RTO (Recovery Time Objective):** Sistem kembali normal dalam **2 jam**

```
RETENTION SCHEDULE:

Backup Harian      → Simpan 30 hari
Backup Mingguan    → Simpan 12 minggu (3 bulan)
Backup Bulanan     → Simpan 12 bulan (1 tahun)
Backup Tahunan     → Simpan 7 tahun (untuk kepatuhan pajak/audit)

LOKASI BACKUP (3-2-1 Rule):
├── 3 salinan data
├── 2 media berbeda (disk + object storage)
└── 1 offsite (region AWS berbeda)

Primary Region  : ap-southeast-1 (Singapura)
Secondary Region: ap-southeast-3 (Jakarta) — offsite backup
```

---

### 3.2 Database Backup (PostgreSQL)

#### 3.2.1 Backup Otomatis

```bash
#!/bin/bash
# scripts/backup/pg_backup.sh
# Dijalankan via Kubernetes CronJob setiap jam

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="shopee_laporan_${TIMESTAMP}.dump"
S3_BUCKET="s3://shopee-laporan-backups"
S3_PATH="${S3_BUCKET}/postgresql/$(date +%Y/%m/%d)/${BACKUP_FILE}"
RETENTION_DAYS=30

echo "[$(date)] Starting PostgreSQL backup..."

# 1. Buat backup dengan pg_dump format custom (lebih cepat restore)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="/tmp/${BACKUP_FILE}"

# 2. Enkripsi sebelum upload ke S3
openssl enc -aes-256-cbc -salt \
    -in "/tmp/${BACKUP_FILE}" \
    -out "/tmp/${BACKUP_FILE}.enc" \
    -pass "env:BACKUP_ENCRYPTION_KEY"

# 3. Upload ke S3 dengan server-side encryption
aws s3 cp "/tmp/${BACKUP_FILE}.enc" "${S3_PATH}.enc" \
    --sse aws:kms \
    --sse-kms-key-id "${KMS_KEY_ID}"

# 4. Verifikasi upload berhasil
aws s3 ls "${S3_PATH}.enc" || {
    echo "[ERROR] Backup upload failed!"
    # Kirim alert ke Slack
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-type: application/json' \
        -d "{\"text\":\"🔴 CRITICAL: PostgreSQL backup FAILED at ${TIMESTAMP}\"}"
    exit 1
}

# 5. Hapus file temporary
rm -f "/tmp/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}.enc"

# 6. Hapus backup lama lebih dari RETENTION_DAYS hari
aws s3 ls "${S3_BUCKET}/postgresql/" --recursive | \
    awk '{print $4}' | \
    while read -r key; do
        file_date=$(echo "$key" | grep -oP '\d{8}' | head -1)
        cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
        if [[ "$file_date" -lt "$cutoff_date" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/${key}"
        fi
    done

echo "[$(date)] Backup completed successfully: ${S3_PATH}.enc"
```

```yaml
# k8s/cronjobs/pg-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgresql-backup
  namespace: production
spec:
  schedule: "0 * * * *"        # Setiap jam
  concurrencyPolicy: Forbid    # Jangan jalankan bersamaan
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: pg-backup
              image: postgres:16
              command: ["/bin/bash", "/scripts/pg_backup.sh"]
              envFrom:
                - secretRef:
                    name: backup-secrets
              volumeMounts:
                - name: backup-scripts
                  mountPath: /scripts
          volumes:
            - name: backup-scripts
              configMap:
                name: backup-scripts
```

#### 3.2.2 Backup Mingguan (Full Dump + Schema)

```bash
#!/bin/bash
# scripts/backup/pg_backup_weekly.sh
# Dijalankan setiap Minggu 02:00 WIB

TIMESTAMP=$(date +%Y%m%d)

# Full backup termasuk roles dan tablespaces
PGPASSWORD="${DB_PASSWORD}" pg_dumpall \
    --host="${DB_HOST}" \
    --username="${DB_USER}" \
    --globals-only \
    --file="/tmp/pg_globals_${TIMESTAMP}.sql"

# Schema-only backup (untuk dokumentasi)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    --schema-only \
    --file="/tmp/schema_${TIMESTAMP}.sql" \
    "${DB_NAME}"

# Upload semua ke S3 weekly folder
aws s3 cp "/tmp/pg_globals_${TIMESTAMP}.sql" \
    "s3://shopee-laporan-backups/weekly/${TIMESTAMP}/" --sse aws:kms

aws s3 cp "/tmp/schema_${TIMESTAMP}.sql" \
    "s3://shopee-laporan-backups/weekly/${TIMESTAMP}/" --sse aws:kms
```

---

### 3.3 File Storage Backup (S3)

```bash
# S3 Cross-Region Replication — dikonfigurasi via Terraform
# Semua file di bucket primary (ap-southeast-1) otomatis direplikasi
# ke bucket secondary (ap-southeast-3)

# terraform/s3.tf
resource "aws_s3_bucket_replication_configuration" "shopee_laporan_replication" {
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD_IA"  # Lebih murah untuk secondary
    }
  }
}

# Versioning wajib aktif
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy — hapus versi lama untuk hemat biaya
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id
  rule {
    id     = "archive-old-versions"
    status = "Enabled"
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }
    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
```

---

### 3.4 Redis Backup (Session & Cache)

```bash
# Redis bersifat cache — bukan primary datastore
# Jika Redis hilang: session user logout (perlu login ulang), cache rebuild otomatis
# Backup Redis tetap dilakukan untuk mempercepat recovery

# Aktifkan RDB snapshot di redis.conf
save 3600 1     # Snapshot jika ada 1 perubahan dalam 1 jam
save 300 100    # Snapshot jika ada 100 perubahan dalam 5 menit
save 60 10000   # Snapshot jika ada 10000 perubahan dalam 1 menit

appendonly yes          # AOF logging untuk durability
appendfsync everysec    # Sync ke disk setiap detik

# Upload RDB file ke S3 setiap 6 jam
```

---

### 3.5 Recovery Procedures

#### 3.5.1 Full Database Restore

```bash
#!/bin/bash
# scripts/recovery/restore_database.sh
# HANYA DIJALANKAN saat ada keputusan dari IC
# Pastikan database target sudah kosong / didrop sebelumnya

set -euo pipefail

RESTORE_TIMESTAMP="${1:-latest}"  # Arg pertama: timestamp backup yang ingin di-restore
S3_BUCKET="s3://shopee-laporan-backups"

echo "⚠️  DATABASE RESTORE PROCEDURE"
echo "================================"
echo "Target DB   : ${DB_NAME} @ ${DB_HOST}"
echo "Backup dari : ${RESTORE_TIMESTAMP}"
echo ""
read -p "Ketik 'RESTORE-CONFIRM' untuk melanjutkan: " confirm
[[ "${confirm}" != "RESTORE-CONFIRM" ]] && echo "Dibatalkan." && exit 0

# 1. Cari file backup
if [[ "${RESTORE_TIMESTAMP}" == "latest" ]]; then
    BACKUP_FILE=$(aws s3 ls "${S3_BUCKET}/postgresql/" --recursive \
        | sort | tail -n 1 | awk '{print $4}')
else
    BACKUP_FILE=$(aws s3 ls "${S3_BUCKET}/postgresql/" --recursive \
        | grep "${RESTORE_TIMESTAMP}" | head -1 | awk '{print $4}')
fi

echo "File backup yang akan di-restore: ${BACKUP_FILE}"
read -p "Lanjutkan? (yes/no): " confirm2
[[ "${confirm2}" != "yes" ]] && exit 0

# 2. Download dari S3
aws s3 cp "s3://${S3_BUCKET}/${BACKUP_FILE}" "/tmp/restore.dump.enc"

# 3. Dekripsi
openssl enc -d -aes-256-cbc \
    -in "/tmp/restore.dump.enc" \
    -out "/tmp/restore.dump" \
    -pass "env:BACKUP_ENCRYPTION_KEY"

# 4. Stop aplikasi (cegah write selama restore)
echo "Scaling down API deployment..."
kubectl scale deployment api --replicas=0 -n production
kubectl scale deployment celery-worker --replicas=0 -n production

# 5. Restore
PGPASSWORD="${DB_PASSWORD}" pg_restore \
    --host="${DB_HOST}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    "/tmp/restore.dump"

# 6. Verifikasi
ROW_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    -t -c "SELECT COUNT(*) FROM transactions;")
echo "Verifikasi: ${ROW_COUNT} baris di tabel transactions"

# 7. Restart aplikasi
kubectl scale deployment api --replicas=3 -n production
kubectl scale deployment celery-worker --replicas=2 -n production

# 8. Cleanup
rm -f "/tmp/restore.dump" "/tmp/restore.dump.enc"

echo "✅ Restore selesai. Monitor dashboard selama 15 menit ke depan."
```

#### 3.5.2 Point-in-Time Recovery (PITR)

```bash
# Untuk restore ke titik waktu tertentu (misal: sebelum incident pukul 14:30)
# Memerlukan WAL archiving yang diaktifkan di PostgreSQL

# Konfigurasi di postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'aws s3 cp %p s3://shopee-laporan-backups/wal/%f'

# Restore ke titik waktu:
pg_restore ... --recovery-target-time="2026-05-04 14:29:59"
```

#### 3.5.3 Recovery Testing (Wajib Bulanan)

```bash
# Setiap bulan, jalankan recovery drill di staging environment
# Catat hasil di: docs/recovery-test-log.md

#!/bin/bash
# scripts/recovery/monthly_drill.sh

echo "=== MONTHLY RECOVERY DRILL ==="
echo "Tanggal: $(date)"
echo "Environment: STAGING"

DRILL_START=$(date +%s)

# 1. Restore backup terbaru ke staging DB
./restore_database.sh latest --env staging

# 2. Jalankan smoke test
python scripts/smoke_test_staging.py

# 3. Ukur waktu
DRILL_END=$(date +%s)
DURATION=$((DRILL_END - DRILL_START))
echo "Recovery time: ${DURATION} detik"
echo "Target RTO: 7200 detik (2 jam)"

if [[ $DURATION -gt 7200 ]]; then
    echo "⚠️ WARNING: Recovery time melebihi RTO target!"
fi

# 4. Catat hasil ke log
echo "$(date)|STAGING|${DURATION}s|$([ $DURATION -le 7200 ] && echo PASS || echo FAIL)" \
    >> docs/recovery-test-log.md
```

---

## 4. MONITORING & ALERTING

### 4.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                      │
├──────────────┬─────────────────┬───────────────────────────┤
│   METRICS    │      LOGS       │         TRACES             │
│  Prometheus  │   Loki /        │  OpenTelemetry +           │
│  + Grafana   │   CloudWatch    │  Jaeger (distributed)      │
└──────────────┴─────────────────┴───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ALERTING & ON-CALL                         │
│  Grafana AlertManager → PagerDuty → Slack + SMS            │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              ERROR TRACKING & APM                           │
│  Sentry (application errors + performance)                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Metrics yang Dipantau

#### 4.2.1 System Metrics (Infrastructure)

```yaml
# Prometheus scrape config — metrics dari setiap node

metrics:
  system:
    - name: cpu_usage_percent
      alert_threshold: "> 80% selama 5 menit"
      severity: MEDIUM

    - name: memory_usage_percent
      alert_threshold: "> 85% selama 5 menit"
      severity: HIGH

    - name: disk_usage_percent
      alert_threshold: "> 80%"
      severity: HIGH
      note: "Di atas 90% → CRITICAL, matikan backup sementara"

    - name: network_io_bytes
      alert_threshold: "Spike > 3x baseline selama 2 menit"
      severity: MEDIUM

  kubernetes:
    - name: pod_restart_count
      alert_threshold: "> 3 kali dalam 10 menit"
      severity: HIGH

    - name: pod_pending_duration
      alert_threshold: "> 5 menit"
      severity: MEDIUM

    - name: node_not_ready
      alert_threshold: "Segera"
      severity: CRITICAL
```

#### 4.2.2 Application Metrics (Business + Technical)

```python
# app/metrics.py — Custom Prometheus metrics

from prometheus_client import Counter, Histogram, Gauge

# Transaksi
TRANSACTIONS_IMPORTED = Counter(
    "shopee_transactions_imported_total",
    "Total transaksi berhasil diimport",
    ["toko_id", "source_type"],
)

TRANSACTIONS_FAILED = Counter(
    "shopee_transactions_import_failed_total",
    "Total transaksi gagal diimport",
    ["toko_id", "reason"],
)

# OCR
OCR_CONFIDENCE_HISTOGRAM = Histogram(
    "shopee_ocr_confidence_score",
    "Distribusi confidence score OCR",
    buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0],
)

OCR_PROCESSING_DURATION = Histogram(
    "shopee_ocr_processing_seconds",
    "Durasi pemrosesan OCR",
    buckets=[1, 2, 5, 10, 30, 60],
)

# AI / LLM
AI_API_CALLS = Counter(
    "shopee_ai_api_calls_total",
    "Total pemanggilan Claude API",
    ["prompt_id", "status"],
)

AI_API_LATENCY = Histogram(
    "shopee_ai_api_latency_seconds",
    "Latency pemanggilan Claude API",
    ["prompt_id"],
    buckets=[0.5, 1, 2, 5, 10, 15, 30],
)

AI_TOKEN_USAGE = Counter(
    "shopee_ai_tokens_total",
    "Total token yang digunakan",
    ["prompt_id", "token_type"],  # token_type: prompt / completion
)

# WhatsApp Bot
WA_MESSAGES_SENT = Counter(
    "shopee_wa_messages_sent_total",
    "Total pesan WhatsApp terkirim",
    ["message_type"],
)

WA_COMMANDS_RECEIVED = Counter(
    "shopee_wa_commands_received_total",
    "Total command WA yang diterima",
    ["command"],
)

# Zakat
ZAKAT_NISHAB_REACHED = Counter(
    "shopee_zakat_nishab_reached_total",
    "Jumlah toko yang mencapai nishab",
)

# Business Health
ACTIVE_SHOPS_GAUGE = Gauge(
    "shopee_active_shops",
    "Jumlah toko aktif saat ini",
)

DAILY_REVENUE_GAUGE = Gauge(
    "shopee_daily_revenue_idr",
    "Total omzet hari ini di semua toko (IDR)",
)
```

#### 4.2.3 API Performance Metrics

```python
# middleware/metrics.py
import time
from prometheus_client import Histogram, Counter

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["method", "endpoint", "status_code"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

# SLA Targets:
# p50 < 0.5s   (median response time)
# p95 < 1.5s   (95th percentile)
# p99 < 3.0s   (99th percentile — PRD NF-01)
# Error rate < 0.5%
```

---

### 4.3 Alert Rules (Grafana)

```yaml
# grafana/alerts/production.yaml

groups:
  - name: api_alerts
    rules:
      # SEV-1: API Error Rate Tinggi
      - alert: HighAPIErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m])
          / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "API error rate di atas 1%"
          description: "Error rate saat ini: {{ $value | humanizePercentage }}"
          runbook: "https://docs.internal/runbook#high-api-error-rate"

      # SEV-2: Latency Tinggi
      - alert: HighAPILatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 3.0
        for: 5m
        labels:
          severity: high
          team: backend
        annotations:
          summary: "API p95 latency di atas 3 detik (PRD NF-01)"
          runbook: "https://docs.internal/runbook#high-latency"

      # SEV-2: AI API Gagal
      - alert: AIAPIHighFailureRate
        expr: |
          rate(shopee_ai_api_calls_total{status="error"}[10m])
          / rate(shopee_ai_api_calls_total[10m]) > 0.05
        for: 10m
        labels:
          severity: high
          team: ai-engineer
        annotations:
          summary: "Claude API error rate > 5%"
          description: "AI Feedback dan Zakat Calculator mungkin tidak berfungsi"

      # SEV-2: Celery Queue Menumpuk
      - alert: CeleryQueueBacklog
        expr: celery_queue_length > 100
        for: 5m
        labels:
          severity: high
          team: backend
        annotations:
          summary: "Celery queue menumpuk: {{ $value }} jobs pending"
          description: "OCR dan Export mungkin terlambat"

  - name: database_alerts
    rules:
      # SEV-1: Database Connection Pool Habis
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          pg_stat_activity_count{state="active"}
          / pg_settings_max_connections > 0.90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool > 90% terpakai"

      # SEV-2: Replication Lag (jika pakai read replica)
      - alert: DatabaseReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "PostgreSQL replication lag > 30 detik"

      # SEV-1: Backup Gagal
      - alert: BackupFailed
        expr: |
          time() - shopee_last_successful_backup_timestamp > 7200
        labels:
          severity: critical
        annotations:
          summary: "Tidak ada backup sukses dalam 2 jam terakhir"

  - name: security_alerts
    rules:
      # SEV-2: Brute Force Login
      - alert: BruteForceLoginAttempt
        expr: |
          rate(http_requests_total{endpoint="/v1/auth/login",status_code="401"}[5m]) > 10
        for: 1m
        labels:
          severity: high
          team: security
        annotations:
          summary: "Terdeteksi potensi brute force login"

      # SEV-1: Tenant Isolation Violation
      - alert: TenantIsolationViolation
        expr: increase(shopee_security_tenant_violation_total[5m]) > 0
        labels:
          severity: critical
          team: security
        annotations:
          summary: "🚨 Terdeteksi percobaan akses data toko lain!"

      # SEV-2: Rate Limit Bypass Attempt
      - alert: RateLimitBypass
        expr: |
          rate(nginx_limit_req_rejected_total[5m]) > 50
        labels:
          severity: high
          team: security

  - name: business_alerts
    rules:
      # Return rate tinggi (alert bisnis, bukan teknikal)
      - alert: HighReturnRate
        expr: |
          (shopee_daily_returns_total / shopee_daily_orders_total) > 0.05
        labels:
          severity: medium
          team: product
        annotations:
          summary: "Return rate hari ini melebihi 5%"
```

---

### 4.4 Dashboard Grafana

**Dashboard yang WAJIB tersedia di production:**

| Dashboard | URL | Refresh | Audience |
|---|---|---|---|
| System Overview | /d/system-overview | 30s | DevOps |
| API Performance | /d/api-performance | 30s | Backend Dev |
| Database Health | /d/db-health | 1m | DevOps |
| AI/LLM Usage & Cost | /d/ai-usage | 5m | AI Engineer, CTO |
| Business Metrics | /d/business-metrics | 5m | Product, CTO |
| Security Events | /d/security-events | 1m | Security |
| WhatsApp Bot | /d/whatsapp-bot | 5m | Backend Dev |
| Backup Status | /d/backup-status | 1h | DevOps |

---

### 4.5 Logging Standards

#### 4.5.1 Structured Logging Format

```python
# Semua log HARUS dalam format JSON structured
# Jangan gunakan print() atau logging.info("string biasa")

import structlog

logger = structlog.get_logger()

# ✅ BENAR — structured log dengan context
await logger.ainfo(
    "transaction_imported",
    toko_id=toko_id,
    order_id=order_id,
    source_type=source_type,
    row_count=len(transactions),
    duration_ms=elapsed_ms,
)

# ✅ BENAR — error dengan context lengkap
await logger.aerror(
    "ocr_processing_failed",
    job_id=job_id,
    toko_id=toko_id,
    confidence_score=confidence,
    error_type=type(e).__name__,
    error_message=str(e),
)

# ❌ SALAH — tidak terstruktur, tidak bisa di-query
print(f"Error processing OCR for {toko_id}: {e}")
logging.error(f"Transaction import failed: {order_id}")
```

#### 4.5.2 Log Levels & Retention

| Level | Kapan Digunakan | Retention |
|---|---|---|
| `DEBUG` | Detail eksekusi (dev only, nonaktif di production) | Tidak disimpan |
| `INFO` | Event bisnis normal (import sukses, user login) | 30 hari |
| `WARNING` | Kondisi tidak normal tapi tidak error (cache miss, fallback) | 60 hari |
| `ERROR` | Error yang perlu ditangani (exception, API gagal) | 90 hari |
| `CRITICAL` | Kondisi yang mengancam sistem (DB down, breach detected) | 1 tahun |

#### 4.5.3 Log yang DILARANG

```python
# ❌ JANGAN pernah log data sensitif
logger.info("User login", password=user_password)          # DILARANG
logger.info("API call", api_key=settings.ANTHROPIC_API_KEY) # DILARANG
logger.info("Transaction", nama_pembeli=nama_pembeli)       # DILARANG (PII)

# ✅ BENAR — log ID, bukan data sensitif
logger.info("User login", user_id=user.id, toko_id=toko_id)
logger.info("API call", prompt_id=prompt_id, latency_ms=latency)
logger.info("Transaction", order_id=order_id, status=status)  # Bukan nama pembeli
```

---

### 4.6 SLO (Service Level Objectives)

```yaml
# Definisi SLO untuk production

SLOs:
  api_availability:
    target: 99.5%             # PRD NF-02
    measurement_window: 30d
    error_budget_per_month: 3.6 jam

  api_latency_p95:
    target: "< 3 detik"       # PRD NF-01
    measurement_window: 30d

  dashboard_load_time:
    target: "< 3 detik untuk 10.000 transaksi"
    measurement_window: 30d

  export_success_rate:
    target: "> 99%"
    measurement_window: 7d

  ocr_processing_success:
    target: "> 80%"           # 80% auto-processed, 20% manual review
    measurement_window: 7d

  backup_success_rate:
    target: "100%"
    measurement_window: 30d
    note: "ZERO tolerance untuk backup failure"

# Error Budget Policy:
# Jika error budget habis > 50% sebelum pertengahan bulan:
# → Freeze semua feature release, fokus ke reliability
# Jika error budget habis > 75%:
# → Postmortem wajib, tidak ada deploy baru sampai budget recovered
```

---

## 5. RUNBOOK OPERASIONAL

> Runbook adalah panduan step-by-step untuk menangani kondisi operasional yang umum terjadi.
> Setiap runbook harus bisa dieksekusi oleh on-call engineer tanpa perlu bertanya ke developer.

---

### RB-001: API Down / Error Rate Tinggi

**Trigger Alert:** `HighAPIErrorRate` — error rate > 1% selama 5 menit  
**Severity:** SEV-1 atau SEV-2  
**ETA Resolution:** 30 menit

```bash
# LANGKAH 1: Verifikasi scope masalah
kubectl get pods -n production
kubectl get pods -n production | grep -v Running   # Cari pod tidak Running

# LANGKAH 2: Cek log error terbaru
kubectl logs deployment/api -n production --since=10m | grep -E "ERROR|CRITICAL"

# LANGKAH 3: Cek apakah masalah di semua pod atau satu pod
kubectl get pods -n production -l app=api -o wide
# Jika hanya 1 pod: restart pod itu saja
# Jika semua pod: masalah lebih dalam (database, dependency external)

# LANGKAH 4: Cek database connectivity
kubectl exec -n production deployment/api -- \
    python -c "from app.database import check_db; import asyncio; asyncio.run(check_db())"

# LANGKAH 5: Cek external dependencies
kubectl exec -n production deployment/api -- curl -s https://api.anthropic.com/health
kubectl exec -n production deployment/api -- redis-cli -u $REDIS_URL ping

# LANGKAH 6A: Jika masalah di pod tertentu — restart pod
kubectl delete pod <nama-pod> -n production
# Pod akan otomatis dibuat ulang oleh Kubernetes

# LANGKAH 6B: Jika masalah setelah deployment terbaru — rollback
kubectl rollout undo deployment/api -n production
kubectl rollout status deployment/api -n production

# LANGKAH 6C: Jika database tidak bisa connect
# → Lanjut ke RB-003 (Database Down)

# LANGKAH 7: Verifikasi resolusi
curl -f https://api.laporan-shopee.id/health/ready
# Expected: {"status":"ready","database":"ok","redis":"ok"}

# LANGKAH 8: Monitor 15 menit setelah fix, update war room
```

---

### RB-002: High Latency / Dashboard Lambat

**Trigger Alert:** `HighAPILatency` — p95 > 3 detik selama 5 menit  
**Severity:** SEV-2  
**ETA Resolution:** 45 menit

```bash
# LANGKAH 1: Identifikasi endpoint yang lambat
# Di Grafana: API Performance dashboard → "Slowest Endpoints" panel
# Atau via log:
kubectl logs deployment/api -n production --since=10m | \
    grep "duration_ms" | sort -t: -k2 -n | tail -20

# LANGKAH 2: Cek apakah ada slow query di database
kubectl exec -n production deployment/postgres -- \
    psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT query, mean_exec_time, calls
    FROM pg_stat_statements
    ORDER BY mean_exec_time DESC
    LIMIT 10;"

# LANGKAH 3: Cek Celery queue — apakah worker overloaded?
kubectl exec -n production deployment/celery-worker -- \
    celery -A app.workers.celery_app inspect active
# Jika banyak task pending → scale up worker

kubectl scale deployment celery-worker --replicas=4 -n production

# LANGKAH 4: Cek cache hit rate Redis
kubectl exec -n production deployment/redis -- redis-cli info stats | grep keyspace

# LANGKAH 5: Jika masalah di query N+1 (lihat log)
# → Buat tiket untuk perbaikan query, bukan hotfix saat incident
# → Sementara: aktifkan aggressive caching

# LANGKAH 6: Scale up API pods jika traffic spike
kubectl scale deployment api --replicas=5 -n production

# LANGKAH 7: Jika masalah di AI API (Claude lambat)
# → Aktifkan circuit breaker, skip AI feedback sementara
# → Tambahkan flag: SKIP_AI_FEEDBACK=true ke ConfigMap
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"SKIP_AI_FEEDBACK":"true"}}'

# Setelah AI API normal, kembalikan:
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"SKIP_AI_FEEDBACK":"false"}}'
```

---

### RB-003: Database Down

**Trigger Alert:** `DatabaseConnectionPoolExhausted` atau health check DB gagal  
**Severity:** SEV-1  
**ETA Resolution:** 30 menit  
**Notifikasi:** IC wajib ping manajemen segera

```bash
# LANGKAH 1: Verifikasi database benar-benar down
kubectl exec -n production deployment/api -- \
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
# Jika gagal → database memang bermasalah

# LANGKAH 2: Cek status RDS (jika menggunakan AWS RDS)
aws rds describe-db-instances \
    --db-instance-identifier shopee-laporan-prod \
    --query 'DBInstances[0].DBInstanceStatus'
# Expected: "available"

# LANGKAH 3: Cek apakah ada maintenance window atau failover
aws rds describe-events \
    --source-identifier shopee-laporan-prod \
    --duration 60  # Event dalam 60 menit terakhir

# LANGKAH 4: Jika ada auto-failover ke replica (RDS Multi-AZ)
# Tunggu failover selesai (5-30 detik biasanya)
# RDS akan update endpoint otomatis — tidak perlu tindakan

# LANGKAH 5: Jika tidak ada auto-failover — manual failover
aws rds failover-db-cluster \
    --db-cluster-identifier shopee-laporan-cluster

# LANGKAH 6: Aktifkan maintenance mode di frontend
# Tampilkan halaman "Sistem sedang dalam pemeliharaan"
kubectl apply -f k8s/maintenance-mode/maintenance-ingress.yaml

# LANGKAH 7: Setelah database kembali — verifikasi
kubectl exec -n production deployment/api -- \
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT COUNT(*) FROM transactions;"

# LANGKAH 8: Nonaktifkan maintenance mode
kubectl delete -f k8s/maintenance-mode/maintenance-ingress.yaml

# LANGKAH 9: Verifikasi data integrity
kubectl exec -n production deployment/api -- \
    python scripts/verify_data_integrity.py
```

---

### RB-004: Backup Gagal

**Trigger Alert:** `BackupFailed` — tidak ada backup sukses > 2 jam  
**Severity:** SEV-2 (bisa eskalasi SEV-1 jika > 6 jam)  
**ETA Resolution:** 30 menit

```bash
# LANGKAH 1: Cek status backup job terakhir
kubectl get jobs -n production | grep pg-backup
kubectl describe job pg-backup-<timestamp> -n production

# LANGKAH 2: Cek log backup job
kubectl logs job/pg-backup-<timestamp> -n production

# LANGKAH 3: Error umum dan solusinya

## Error: "No space left on device" di pod backup
## Solusi: Tambah volume atau cleanup file lama
kubectl exec -n production job/pg-backup-<timestamp> -- df -h
# Jika penuh: cleanup /tmp manual

## Error: "Connection to S3 failed" / Permission denied
## Solusi: Verifikasi IAM role
aws sts get-caller-identity  # Dari dalam pod
aws s3 ls s3://shopee-laporan-backups/  # Test akses

## Error: "pg_dump: connection to server failed"
## Database bermasalah → lanjut ke RB-003 dulu

# LANGKAH 4: Jalankan backup manual
kubectl create job pg-backup-manual-$(date +%Y%m%d%H%M) \
    --from=cronjob/postgresql-backup -n production

# LANGKAH 5: Verifikasi backup muncul di S3
aws s3 ls s3://shopee-laporan-backups/postgresql/ \
    --recursive | sort | tail -5

# LANGKAH 6: Update monitoring — reset last_backup_timestamp
# Ini akan clear alert otomatis setelah backup sukses
```

---

### RB-005: OCR Processing Gagal Massal

**Trigger Alert:** OCR error rate > 30% dalam 15 menit  
**Severity:** SEV-3  
**ETA Resolution:** 1 jam

```bash
# LANGKAH 1: Cek apakah masalah di Claude Vision API atau internal
kubectl logs deployment/celery-worker -n production --since=15m | grep "ocr"

# LANGKAH 2: Test langsung ke Claude API
kubectl exec -n production deployment/api -- \
    python -c "
import anthropic
client = anthropic.Anthropic()
response = client.messages.create(
    model='claude-sonnet-4-20250514',
    max_tokens=10,
    messages=[{'role': 'user', 'content': 'ping'}]
)
print(response.content)
"

# LANGKAH 3: Jika Claude API bermasalah
# → Aktifkan Tesseract fallback
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"OCR_FALLBACK_MODE":"tesseract"}}'

# LANGKAH 4: Cek apakah ada file yang stuck di queue
kubectl exec -n production deployment/celery-worker -- \
    celery -A app.workers.celery_app inspect reserved

# LANGKAH 5: Jika ada task stuck, purge dan retry
kubectl exec -n production deployment/celery-worker -- \
    celery -A app.workers.celery_app purge -Q ocr-queue  # HATI-HATI: hapus semua task pending

# Retry dari database (task yang belum selesai)
kubectl exec -n production deployment/api -- \
    python scripts/retry_failed_ocr_jobs.py --since-hours 1

# LANGKAH 6: Notifikasi ke user via status page
# Update https://status.laporan-shopee.id
# Pesan: "Fitur upload screenshot sedang mengalami gangguan. Data CSV masih bisa diimport."
```

---

### RB-006: WhatsApp Bot Tidak Merespons

**Trigger Alert:** WA message delivery rate < 80%  
**Severity:** SEV-3  
**ETA Resolution:** 30 menit

```bash
# LANGKAH 1: Cek status Twilio
open https://status.twilio.com
# Jika ada incident di Twilio → tidak ada yang bisa dilakukan, tunggu

# LANGKAH 2: Cek webhook handler
kubectl logs deployment/api -n production --since=15m | grep "whatsapp"

# LANGKAH 3: Verifikasi Twilio webhook masih mengarah ke URL yang benar
# Di Twilio Console: Messaging → WhatsApp Senders → Webhook URL
# Harus: https://api.laporan-shopee.id/v1/whatsapp/webhook

# LANGKAH 4: Test webhook secara manual
curl -X POST https://api.laporan-shopee.id/v1/whatsapp/webhook \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=whatsapp%3A%2B628123456789&Body=%2Flaporan&To=whatsapp%3A%2B628XXXXXXX"

# LANGKAH 5: Cek Twilio credentials masih valid
kubectl exec -n production deployment/api -- \
    python -c "
from twilio.rest import Client
client = Client()  # Ambil dari env
# Coba kirim test message ke nomor developer
client.messages.create(
    from_='whatsapp:+628XXXXXXX',
    to='whatsapp:+62DEVELOPER_NUMBER',
    body='[TEST] Bot connectivity check'
)
"

# LANGKAH 6: Cek Redis session store — apakah session user hilang?
kubectl exec -n production deployment/redis -- \
    redis-cli keys "wa_session:*" | wc -l

# Jika 0 dan seharusnya ada user aktif:
# Session hilang → user perlu /start ulang. Umumkan di status page.

# LANGKAH 7: Restart WhatsApp handler (jika masalah internal)
kubectl rollout restart deployment/api -n production
```

---

### RB-007: Zakat Calculator Error

**Trigger Alert:** Manuan atau user report  
**Severity:** SEV-3  
**ETA Resolution:** 45 menit

```bash
# LANGKAH 1: Identifikasi error spesifik
kubectl logs deployment/api -n production --since=1h | grep -i "zakat"

# LANGKAH 2: Cek apakah Gold Price API bermasalah
curl -s "https://api.harga-emas.id/v1/price?currency=IDR&weight_unit=gram" \
    -H "X-API-Key: $GOLD_PRICE_API_KEY"

# LANGKAH 3: Jika Gold Price API down — cek cache terakhir
kubectl exec -n production deployment/redis -- \
    redis-cli get "gold_price:latest"

# Jika cache expired (> 1 jam):
# Sistem seharusnya sudah fallback ke cached value
# Jika tidak — ada bug di fallback logic → buat incident ticket

# LANGKAH 4: Manual override harga emas sementara (emergency only)
kubectl exec -n production deployment/redis -- \
    redis-cli set "gold_price:manual_override" "1470000"
kubectl exec -n production deployment/redis -- \
    redis-cli set "gold_price:manual_override_date" "$(date +%Y-%m-%d)"

# Set flag di API untuk pakai override
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"GOLD_PRICE_OVERRIDE":"true"}}'

# LANGKAH 5: Notifikasi user via dashboard
# Tampilkan banner: "Kalkulasi zakat menggunakan harga emas terakhir: Rp X.XXX.XXX/gram (DD Mei 2026)"

# LANGKAH 6: Hapus override setelah Gold API pulih
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"GOLD_PRICE_OVERRIDE":"false"}}'
kubectl exec -n production deployment/redis -- \
    redis-cli del "gold_price:manual_override"
```

---

### RB-008: Security Incident — Unauthorized Access

**Trigger Alert:** `TenantIsolationViolation` atau laporan user  
**Severity:** SEV-1 (eskalasi ke Security Lead segera)  
**ETA Resolution:** Tergantung scope

```bash
# ⚠️ JANGAN HAPUS BUKTI — preserve semua log sebelum tindakan apapun

# LANGKAH 1: Identifikasi scope akses tidak sah
kubectl exec -n production deployment/api -- \
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT *
    FROM security_audit_logs
    WHERE event_type = 'TENANT_VIOLATION'
    AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC;"

# LANGKAH 2: Identifikasi akun yang bermasalah
# Ambil user_id dari log, cek aktivitasnya

# LANGKAH 3: Suspend akun yang curigai SEGERA
kubectl exec -n production deployment/api -- \
    python -c "
import asyncio
from app.services.user_service import suspend_user
asyncio.run(suspend_user(user_id='USER-ID-SUSPECT', reason='security_investigation'))
"

# LANGKAH 4: Blacklist token aktif user tersebut
kubectl exec -n production deployment/redis -- \
    redis-cli set "token_blacklist:USER-ID-SUSPECT" "1" EX 86400

# LANGKAH 5: Export audit log untuk investigasi
kubectl exec -n production deployment/api -- \
    python scripts/export_audit_log.py \
        --user-id "USER-ID-SUSPECT" \
        --since "2026-05-04T00:00:00" \
        --output /tmp/audit_export.csv

kubectl cp production/api-pod:/tmp/audit_export.csv ./evidence/$(date +%Y%m%d)_audit.csv

# LANGKAH 6: Hubungi Security Lead dan IC
# Ikuti protokol di Seksi 2.4 (Security Incident — Data Breach Protocol)

# LANGKAH 7: Jangan restart atau hapus pod — preserve state untuk forensik
# Buat snapshot pod jika diperlukan untuk investigasi forensik mendalam
```

---

## 6. COMPLIANCE & AUDIT

### 6.1 Kepatuhan Regulasi

| Regulasi | Scope | Status | Review |
|---|---|---|---|
| **UU PDP No. 27/2022** (Indonesia) | Data pribadi pembeli (nama, kota) | Implementasi enkripsi kolom PII | Tahunan |
| **Fatwa DSN-MUI** | Syariah compliance engine (zakat, gharar, zalim) | Sesuai PROMPT-SYARIAH-001/002 | Per update prompt |
| **PCI DSS** | Tidak menyimpan data kartu — tidak in scope | N/A | — |
| **ISO 27001** | Roadmap untuk sertifikasi | Belum | 2027 |

---

### 6.2 Audit Log Requirements

Sistem WAJIB menyimpan audit trail untuk:

```python
# Semua event berikut harus dicatat di tabel audit_logs

AUDITABLE_EVENTS = [
    # Authentication
    "user.login.success",
    "user.login.failed",
    "user.logout",
    "user.password.changed",
    "user.token.refreshed",

    # Data Access
    "transaction.imported",
    "transaction.deleted",
    "report.exported",
    "report.viewed",

    # Security
    "security.tenant_violation.attempt",
    "security.rate_limit.exceeded",
    "security.invalid_webhook.received",
    "security.prompt_injection.detected",

    # Admin Actions
    "admin.user.suspended",
    "admin.data.deleted",
    "admin.config.changed",

    # AI / Sensitive
    "ai.prompt.called",
    "ai.zakat.calculated",
    "ai.report.generated",
]

# Schema tabel audit_logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = mapped_column(UUID, primary_key=True, default=uuid4)
    event_type = mapped_column(String(100), nullable=False, index=True)
    user_id = mapped_column(UUID, ForeignKey("users.id"), nullable=True)
    toko_id = mapped_column(UUID, nullable=True, index=True)
    ip_address = mapped_column(String(45))      # IPv6 max 45 chars
    user_agent = mapped_column(String(500))
    request_id = mapped_column(String(50))
    metadata = mapped_column(JSONB)             # Detail tambahan per event type
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Audit log TIDAK BOLEH di-update atau di-delete
    # Gunakan append-only table atau immutable storage
```

---

### 6.3 Penetration Testing Schedule

| Frekuensi | Scope | Pelaksana |
|---|---|---|
| **Sebelum go-live** | Full scope: API, web, infrastruktur | External pentester |
| **Tahunan** | Full scope | External pentester |
| **Setiap major release** | Scope terbatas: fitur baru | Internal security review |
| **Berkelanjutan** | DAST scanning otomatis | OWASP ZAP di CI/CD |

---

### 6.4 Vulnerability Disclosure Policy

Jika ada pihak eksternal yang menemukan vulnerability:

```
Kontak: security@laporan-shopee.id (PGP key tersedia di /security.txt)
Response time: 48 jam untuk acknowledgment
Fix commitment: 
  - Critical: 7 hari
  - High: 30 hari
  - Medium: 90 hari

Hall of Fame: Peneliti yang responsible disclosure mendapat credit publik
Bug Bounty: Program dalam roadmap Q3 2026
```

```
# /.well-known/security.txt (wajib ada di production)
Contact: mailto:security@laporan-shopee.id
Expires: 2027-05-04T00:00:00z
Encryption: https://laporan-shopee.id/.well-known/pgp-key.asc
Preferred-Languages: id, en
Policy: https://laporan-shopee.id/security-policy
```

---

## LAMPIRAN A: Security Checklist — Pre-Launch

```
=== AUTENTIKASI & OTORISASI ===
☐ JWT menggunakan RS256 (bukan HS256)
☐ JWT TTL dikonfigurasi dengan benar (8 jam access, 30 hari refresh)
☐ RBAC diimplementasi dan ditest untuk semua role
☐ Tenant isolation ditest — penjual A tidak bisa akses data penjual B
☐ Semua endpoint sensitif memerlukan autentikasi

=== INPUT VALIDATION ===
☐ Semua input divalidasi (type, length, format)
☐ SQL injection dicegah (ORM + parameterized query)
☐ Prompt injection prevention diimplementasi
☐ File upload divalidasi (MIME type + magic bytes + ukuran)
☐ CSRF protection aktif untuk semua state-changing requests

=== DATA PROTECTION ===
☐ Kolom PII dienkripsi (nama_pembeli)
☐ Backup dienkripsi sebelum upload ke S3
☐ TLS 1.3 aktif, TLS 1.0/1.1 dinonaktifkan
☐ Security headers diimplementasi (HSTS, CSP, X-Frame-Options, dll.)
☐ Tidak ada credential/secret di kode atau log

=== INFRASTRUKTUR ===
☐ Container berjalan sebagai non-root user
☐ Read-only filesystem untuk container
☐ Network policy — pod tidak bisa komunikasi bebas
☐ Database tidak exposed ke internet (dalam private subnet)
☐ Redis tidak exposed ke internet
☐ Backup tested — recovery drill berhasil

=== MONITORING ===
☐ Semua alert rules dikonfigurasi di Grafana
☐ PagerDuty on-call rotation aktif
☐ Audit log berjalan dan menyimpan semua auditable events
☐ Sentry error tracking aktif
☐ Log tidak mengandung data sensitif (PII, credentials)

=== COMPLIANCE ===
☐ Privacy policy tersedia dan akurat
☐ Terms of service tersedia
☐ security.txt tersedia di /.well-known/security.txt
☐ Data retention policy dikonfigurasi
```

---

## LAMPIRAN B: Quick Reference — Emergency Commands

```bash
# === SCALE ===
kubectl scale deployment api --replicas=5 -n production
kubectl scale deployment celery-worker --replicas=4 -n production

# === ROLLBACK ===
kubectl rollout undo deployment/api -n production
kubectl rollout undo deployment/web -n production
kubectl rollout history deployment/api -n production  # Lihat history

# === RESTART ===
kubectl rollout restart deployment/api -n production
kubectl delete pod <pod-name> -n production  # Restart 1 pod

# === LOGS ===
kubectl logs deployment/api -n production --since=10m -f
kubectl logs deployment/celery-worker -n production --since=10m
kubectl logs -l app=api -n production --since=5m  # Semua pod API

# === DEBUG ===
kubectl exec -it deployment/api -n production -- bash
kubectl exec -it deployment/redis -n production -- redis-cli

# === MAINTENANCE MODE ===
kubectl apply -f k8s/maintenance-mode/maintenance-ingress.yaml    # Aktifkan
kubectl delete -f k8s/maintenance-mode/maintenance-ingress.yaml   # Nonaktifkan

# === BACKUP MANUAL ===
kubectl create job pg-backup-manual-$(date +%Y%m%d%H%M) \
    --from=cronjob/postgresql-backup -n production

# === CIRCUIT BREAKER ===
# Nonaktifkan AI feedback sementara:
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"SKIP_AI_FEEDBACK":"true"}}'
# Re-aktifkan:
kubectl patch configmap api-config -n production \
    --type merge -p '{"data":{"SKIP_AI_FEEDBACK":"false"}}'
```

---

*Dokumen ini bersifat CONFIDENTIAL — hanya untuk tim engineering internal.*  
*Simpan salinan offline untuk akses saat sistem production bermasalah.*  
*Last updated: 4 Mei 2026 | Review berikutnya: 4 Agustus 2026 (quarterly)*
