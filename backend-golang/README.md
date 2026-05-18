# KRS Backend — Golang

Refactored backend Sistem KRS dari Python Flask ke Golang menggunakan Echo + GORM.

## Tech Stack

| Layer | Library |
|---|---|
| HTTP Framework | [Echo v4](https://echo.labstack.com/) |
| ORM | [GORM v2](https://gorm.io/) |
| DB Driver | gorm.io/driver/postgres (pgx) |
| JWT | golang-jwt/jwt/v5 |
| Password | golang.org/x/crypto/bcrypt |
| Cache | Upstash Redis REST API |
| Config | joho/godotenv |

## Setup

### 1. Install Go 1.22+
```
https://go.dev/dl/
```

### 2. Clone & masuk folder
```bash
cd backend-golang
```

### 3. Copy env
```bash
cp .env.example .env
# Edit .env dengan credentials yang sama dari backend Flask
```

### 4. Install dependencies
```bash
go mod tidy
```

### 5. Jalankan (development)
```bash
# Install air untuk hot reload
go install github.com/air-verse/air@latest

# Jalankan dengan hot reload
air

# Atau tanpa hot reload
go run .
```

Server berjalan di `http://localhost:8080`

## Build Production

```bash
go build -o app .
./app
```

## Deployment ke Railway

Railway akan otomatis detect `Dockerfile` dan build image.

Environment variables yang dibutuhkan di Railway (sama seperti Flask service):
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ACCESS_TOKEN_EXPIRES`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CORS_ORIGINS`

## Struktur Project

```
backend-golang/
├── main.go                    # Entry point & router
├── config/config.go           # Load env vars
├── constants/mata_kuliah.go   # Daftar MK & lookup maps
├── database/database.go       # GORM connection pool
├── models/models.go           # DB models + response structs
├── middleware/auth.go         # JWT & role middleware
├── handlers/                  # HTTP layer (Echo handlers)
├── services/                  # Business logic
└── utils/                     # Cache client + response helpers
```

## API Endpoints

Semua endpoint identik dengan backend Flask — tidak ada breaking changes ke frontend.

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/admin/dashboard
GET    /api/admin/mahasiswa
POST   /api/admin/mahasiswa
PUT    /api/admin/mahasiswa/:id
DELETE /api/admin/mahasiswa/:id
PUT    /api/admin/mahasiswa/:id/dosen-pa
GET    /api/admin/dosen
POST   /api/admin/dosen
PUT    /api/admin/dosen/:id
DELETE /api/admin/dosen/:id

GET    /api/mahasiswa/profile
GET    /api/mahasiswa/krs
PUT    /api/mahasiswa/krs
GET    /api/mahasiswa/mata-kuliah-tersedia

GET    /api/dosen/profile
GET    /api/dosen/mahasiswa-bimbingan
GET    /api/dosen/mahasiswa-bimbingan/:id

GET    /api/health
```

## Catatan Migrasi

- Database tetap Supabase PostgreSQL (tidak ada migration baru)
- JWT secret harus sama dengan Flask service (`JWT_SECRET_KEY`)
- Token yang dibuat Flask masih valid di Golang (format HS256 kompatibel)
- Response format identik: `{"data": ..., "message": "..."}` / `{"error": "..."}`
