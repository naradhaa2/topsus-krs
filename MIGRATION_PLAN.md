# Migration Plan: Flask → Golang

## 1. Tech Stack Mapping

| Komponen | Flask (Sekarang) | Golang (Target) |
|---|---|---|
| HTTP Framework | Flask 3.0 | Echo v4 (labstack/echo) |
| ORM | Flask-SQLAlchemy + SQLAlchemy | GORM v2 (gorm.io/gorm) |
| DB Driver | psycopg2-binary | gorm.io/driver/postgres (pgx) |
| JWT | Flask-JWT-Extended | golang-jwt/jwt/v5 |
| Password Hashing | bcrypt 4.1 | golang.org/x/crypto/bcrypt |
| Redis Client | upstash-redis (REST) | go-redis/v9 (REST via HTTP) |
| Env Config | python-dotenv | joho/godotenv |
| CORS | Flask-CORS | labstack/echo/middleware |
| Server | Gunicorn | Built-in (net/http via Echo) |
| Logging | print/app.logger | log/slog (stdlib Go 1.21+) |

**Alasan memilih Echo:**
- API mirip Express/Flask (route groups, middleware chain)
- Performa lebih cepat dari Gin untuk handler yang banyak middleware
- Context-based seperti Flask's `request` context
- Built-in request validation support

**Alasan memilih GORM:**
- Paling mirip SQLAlchemy dari sisi API
- Support JSONB PostgreSQL via `datatypes.JSON`
- Connection pooling via `database/sql` yang sudah mature

---

## 2. Struktur Folder Flask → Golang

```
Flask                          Golang
─────────────────────────────────────────────────────────
backend/
  app.py                  →   backend-golang/main.go
  config.py               →   backend-golang/config/config.go
  models.py               →   backend-golang/models/models.go
  routes/auth.py          →   backend-golang/handlers/auth.go
                              backend-golang/services/auth_service.go
  routes/admin.py         →   backend-golang/handlers/admin.go
                              backend-golang/services/admin_service.go
  routes/mahasiswa.py     →   backend-golang/handlers/mahasiswa.go
                              backend-golang/services/mahasiswa_service.go
  routes/dosen.py         →   backend-golang/handlers/dosen.go
                              backend-golang/services/dosen_service.go
  utils/cache.py          →   backend-golang/utils/cache.go
  utils/helpers.py        →   backend-golang/utils/response.go
  utils/decorators.py     →   backend-golang/middleware/auth.go
  constants.py            →   backend-golang/constants/mata_kuliah.go
  requirements.txt        →   backend-golang/go.mod
  Procfile                →   backend-golang/Dockerfile
                              (Railway auto-detect Dockerfile)
```

---

## 3. Endpoint Mapping Lengkap (18 Endpoints)

### Auth Routes (`/api/auth`)

| # | Method | Flask Route | Golang Handler | Middleware |
|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | `handlers.Login` | — |
| 2 | GET | `/api/auth/me` | `handlers.GetMe` | `JWTMiddleware` |

### Admin Routes (`/api/admin`)

| # | Method | Flask Route | Golang Handler | Middleware | Cache |
|---|---|---|---|---|---|
| 3 | GET | `/api/admin/dashboard` | `handlers.Dashboard` | `AdminRequired` | `krs:dashboard` TTL 600s |
| 4 | GET | `/api/admin/mahasiswa` | `handlers.ListMahasiswa` | `AdminRequired` | `krs:admin:mahasiswa:*` TTL 300s |
| 5 | POST | `/api/admin/mahasiswa` | `handlers.CreateMahasiswa` | `AdminRequired` | Invalidate `krs:admin:mahasiswa:*`, `krs:dashboard` |
| 6 | PUT | `/api/admin/mahasiswa/:id` | `handlers.UpdateMahasiswa` | `AdminRequired` | Invalidate `krs:admin:mahasiswa:*`, `krs:dashboard` |
| 7 | DELETE | `/api/admin/mahasiswa/:id` | `handlers.DeleteMahasiswa` | `AdminRequired` | Invalidate `krs:admin:mahasiswa:*`, `krs:dashboard` |
| 8 | PUT | `/api/admin/mahasiswa/:id/dosen-pa` | `handlers.AssignDosenPA` | `AdminRequired` | Invalidate `krs:admin:mahasiswa:*`, `krs:dashboard`, `krs:dosen:{id}:bimbingan` |
| 9 | GET | `/api/admin/dosen` | `handlers.ListDosen` | `AdminRequired` | `krs:admin:dosen:*` TTL 300s |
| 10 | POST | `/api/admin/dosen` | `handlers.CreateDosen` | `AdminRequired` | Invalidate `krs:admin:dosen:*`, `krs:dashboard` |
| 11 | PUT | `/api/admin/dosen/:id` | `handlers.UpdateDosen` | `AdminRequired` | Invalidate `krs:admin:dosen:*` |
| 12 | DELETE | `/api/admin/dosen/:id` | `handlers.DeleteDosen` | `AdminRequired` | Invalidate `krs:admin:dosen:*`, `krs:dashboard` |

### Mahasiswa Routes (`/api/mahasiswa`)

| # | Method | Flask Route | Golang Handler | Middleware | Cache |
|---|---|---|---|---|---|
| 13 | GET | `/api/mahasiswa/profile` | `handlers.MahasiswaProfile` | `MahasiswaRequired` | — |
| 14 | GET | `/api/mahasiswa/krs` | `handlers.GetKRS` | `MahasiswaRequired` | — |
| 15 | PUT | `/api/mahasiswa/krs` | `handlers.UpdateKRS` | `MahasiswaRequired` | Invalidate `krs:dosen:{dosen_pa_id}:bimbingan` |
| 16 | GET | `/api/mahasiswa/mata-kuliah-tersedia` | `handlers.GetMKTersedia` | `MahasiswaRequired` | — |

### Dosen Routes (`/api/dosen`)

| # | Method | Flask Route | Golang Handler | Middleware | Cache |
|---|---|---|---|---|---|
| 17 | GET | `/api/dosen/profile` | `handlers.DosenProfile` | `DosenRequired` | — |
| 18 | GET | `/api/dosen/mahasiswa-bimbingan` | `handlers.GetMahasiswaBimbingan` | `DosenRequired` | `krs:dosen:{id}:bimbingan` TTL 300s |
| 19 | GET | `/api/dosen/mahasiswa-bimbingan/:id` | `handlers.GetDetailMahasiswa` | `DosenRequired` | — |

> Endpoint 19 tidak terhitung di prompt asli (18), tapi ada di kode Flask — sudah di-include.

### Health Check

| # | Method | Route | Handler |
|---|---|---|---|
| 20 | GET | `/api/health` | Inline di `main.go` |

---

## 4. Response Format (Harus Identik)

### Success
```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error
```json
{
  "error": "Pesan error"
}
```

### Pagination (Admin list endpoints)
```json
{
  "data": {
    "mahasiswa": [...],
    "total": 50,
    "pages": 5,
    "page": 1,
    "per_page": 10
  },
  "message": "Success"
}
```

---

## 5. JWT Claims Mapping

```
Flask (additional_claims):          Golang (jwt.MapClaims):
{                                   {
  "sub": "uuid-string",               "sub": "uuid-string",
  "role": "admin|mahasiswa|dosen",    "role": "admin|mahasiswa|dosen",
  "nama": "Nama User"                 "nama": "Nama User",
}                                     "exp": unix_timestamp
                                    }
```

**Catatan:** Flask-JWT-Extended otomatis mengisi `sub` dan `exp`. Di Golang kita isi manual.

---

## 6. Cache Key Pattern

```
krs:dashboard                          → Dashboard stats (TTL: 600s)
krs:admin:mahasiswa:page{n}:per{n}:q{s} → List mahasiswa (TTL: 300s)
krs:admin:dosen:page{n}:per{n}:q{s}     → List dosen (TTL: 300s)
krs:dosen:{uuid}:bimbingan             → Mahasiswa bimbingan dosen (TTL: 300s)
```

---

## 7. GORM Model → Flask Model Mapping

| Flask SQLAlchemy | GORM Golang |
|---|---|
| `db.Column(UUID, primary_key=True)` | `ID uuid.UUID \`gorm:"type:uuid;primaryKey"\`` |
| `db.Column(String(255), unique=True)` | `Email string \`gorm:"size:255;uniqueIndex"\`` |
| `db.Column(JSONB)` | `MataKuliah datatypes.JSON \`gorm:"type:jsonb"\`` |
| `db.relationship(back_populates=...)` | `DosenPA Dosen \`gorm:"foreignKey:DosenPAID"\`` |
| `server_default=db.func.now()` | `CreatedAt time.Time \`gorm:"autoCreateTime"\`` |
| `ondelete="SET NULL"` | `gorm:"constraint:OnDelete:SET NULL"` |

---

## 8. Dependency Injection Pattern

Flask menggunakan global `db`, `app.config`. Golang akan menggunakan struct `Handler` yang di-inject:

```go
// Flask: global state
from models import db

// Golang: dependency injection via struct
type Handler struct {
    DB    *gorm.DB
    Cache *CacheClient
    Cfg   *config.Config
}
```

---

## 9. Risk & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| JSONB handling berbeda | Medium | Gunakan `gorm.io/datatypes` package |
| UUID parsing di route param | Low | Echo bind UUID otomatis via `:id` |
| Upstash Redis REST API | Low | Wrap dengan `net/http`, sama seperti Python |
| bcrypt cost factor (12) | None | `golang.org/x/crypto/bcrypt` support cost 12 |
| Pagination logic | Low | Implementasi manual LIMIT/OFFSET di GORM |
| Float precision (rata_sks) | Low | Gunakan `math.Round` untuk 2 desimal |
