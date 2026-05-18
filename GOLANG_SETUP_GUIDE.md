# Golang Setup Guide — Sistem KRS

## Prerequisites

1. **Install Go 1.22+**
   ```
   https://go.dev/dl/
   ```
   Verifikasi:
   ```bash
   go version
   # go version go1.22.x windows/amd64
   ```

2. **Install tools**
   ```bash
   go install github.com/air-verse/air@latest   # hot reload dev
   ```

3. **Clone / buat folder project**
   ```bash
   # Di dalam repo yang sudah ada:
   mkdir backend-golang
   cd backend-golang
   ```

---

## Project Initialization

```bash
cd backend-golang
go mod init github.com/krsnkrs/backend
```

Ini membuat `go.mod` dengan module path `github.com/krsnkrs/backend`.

---

## Go Packages yang Dibutuhkan

Jalankan semua di dalam `backend-golang/`:

```bash
# HTTP Framework
go get github.com/labstack/echo/v4
go get github.com/labstack/echo/v4/middleware

# ORM + Database
go get gorm.io/gorm
go get gorm.io/driver/postgres

# JSONB support
go get gorm.io/datatypes

# JWT
go get github.com/golang-jwt/jwt/v5

# Password hashing
go get golang.org/x/crypto

# Env config
go get github.com/joho/godotenv

# UUID
go get github.com/google/uuid
```

> Redis: Kita gunakan Upstash **REST API** via `net/http` standar (tidak perlu go-redis).
> Ini konsisten dengan implementasi Python yang juga pakai REST client, bukan native protocol.

---

## Struktur Project Lengkap

```
backend-golang/
├── main.go                    # Entry point, router setup, server start
├── go.mod                     # Module dependencies
├── go.sum                     # Dependency checksums
├── .env                       # Env vars (gitignored)
├── .env.example               # Template env vars
├── Dockerfile                 # Railway deployment
├── .air.toml                  # Hot reload config (dev only)
│
├── config/
│   └── config.go              # Load & validate env vars → Config struct
│
├── constants/
│   └── mata_kuliah.go         # MATA_KULIAH_LIST, MAX_SKS, lookup maps
│
├── database/
│   └── database.go            # GORM DB connection + connection pool
│
├── models/
│   └── models.go              # Admin, Dosen, Mahasiswa structs (GORM tags)
│
├── middleware/
│   └── auth.go                # JWT validation + AdminRequired/MahasiswaRequired/DosenRequired
│
├── handlers/
│   ├── auth.go                # Login, GetMe
│   ├── admin.go               # Dashboard, CRUD mahasiswa, CRUD dosen, AssignDosenPA
│   ├── mahasiswa.go           # Profile, GetKRS, UpdateKRS, GetMKTersedia
│   └── dosen.go               # Profile, GetMahasiswaBimbingan, GetDetailMahasiswa
│
├── services/
│   ├── auth_service.go        # FindUserByEmail, VerifyPassword, GenerateToken
│   ├── admin_service.go       # Business logic admin CRUD
│   ├── mahasiswa_service.go   # KRS validation & update logic
│   └── dosen_service.go       # Bimbingan logic
│
└── utils/
    ├── cache.go               # GetCache, SetCache, DeleteCache, DeletePattern
    └── response.go            # SuccessResponse, ErrorResponse
```

---

## Environment Variables

Buat file `backend-golang/.env` (copy dari `.env.example`):

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRES=3600

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-app.onrender.com

# Server
PORT=8080
```

---

## Quick Start — Development

```bash
cd backend-golang

# 1. Copy env
cp .env.example .env
# Edit .env dengan credentials yang sama dari backend Flask

# 2. Download dependencies
go mod tidy

# 3. Jalankan dengan hot reload
air

# atau tanpa hot reload:
go run main.go
```

Server berjalan di `http://localhost:8080`

---

## Air Config (.air.toml)

```toml
root = "."
tmp_dir = "tmp"

[build]
cmd = "go build -o ./tmp/main ."
bin = "./tmp/main"
include_ext = ["go"]
exclude_dir = ["tmp", "vendor"]
delay = 500

[log]
time = false

[misc]
clean_on_exit = true
```

---

## Build untuk Production

```bash
# Build binary
go build -o app .

# Jalankan
./app
```

---

## Dockerfile untuk Railway

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o app .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/app .
EXPOSE 8080
CMD ["./app"]
```

---

## go.mod Expected

```go
module github.com/krsnkrs/backend

go 1.22

require (
    github.com/golang-jwt/jwt/v5 v5.2.1
    github.com/google/uuid v1.6.0
    github.com/joho/godotenv v1.5.1
    github.com/labstack/echo/v4 v4.12.0
    golang.org/x/crypto v0.24.0
    gorm.io/datatypes v1.2.1
    gorm.io/driver/postgres v1.5.9
    gorm.io/gorm v1.25.10
)
```

---

## Verifikasi Setup

```bash
# Test build berhasil
go build ./...

# Test tidak ada lint error
go vet ./...

# Test endpoint health
curl http://localhost:8080/api/health
# Response: {"data":null,"message":"ok"}
```

---

## IDE Setup (VS Code)

Install extension: **Go** (golang.go)

Settings yang direkomendasikan (`settings.json`):
```json
{
  "go.toolsManagement.autoUpdate": true,
  "go.lintTool": "golangci-lint",
  "editor.formatOnSave": true,
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  }
}
```
