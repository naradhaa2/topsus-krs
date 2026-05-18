# Refactor Checklist: Flask → Golang

## Status Legend
- [ ] Belum dikerjakan
- [~] Sedang dikerjakan
- [x] Selesai

---

## PHASE 1 — Documentation (Prioritas: SEKARANG)

- [x] `MIGRATION_PLAN.md` — Mapping lengkap Flask → Golang
- [x] `GOLANG_SETUP_GUIDE.md` — Setup Go workspace & packages
- [x] `PERFORMANCE_COMPARISON.md` — Analisis performa
- [x] `REFACTOR_CHECKLIST.md` — Dokumen ini

---

## PHASE 2 — Project Scaffolding (Prioritas: TINGGI)

### 2.1 Inisialisasi Project
- [x] Buat folder `backend-golang/`
- [x] `go mod init krs/backend` (module path: krs/backend)
- [ ] Install semua dependencies — **jalankan `go mod tidy` setelah Go terinstall**
- [x] Buat `.env.example` dengan semua variables
- [x] Buat `.air.toml` untuk hot reload
- [x] Buat `Dockerfile` untuk Railway

### 2.2 Folder Structure
- [x] Buat folder `config/`
- [x] Buat folder `constants/`
- [x] Buat folder `database/`
- [x] Buat folder `models/`
- [x] Buat folder `middleware/`
- [x] Buat folder `handlers/`
- [x] Buat folder `services/`
- [x] Buat folder `utils/`

---

## PHASE 3 — Core Implementation (Prioritas: TINGGI)

### 3.1 Config & Constants
- [x] `config/config.go`
  - [x] Struct `Config` dengan semua field env var
  - [x] Fungsi `Load()` yang validasi semua required vars
  - [x] Panic jika `DATABASE_URL` atau `JWT_SECRET_KEY` kosong
  - [x] Parse `CORS_ORIGINS` sebagai slice string

- [x] `constants/mata_kuliah.go`
  - [x] `MataKuliahList` slice (12 MK dari Flask)
  - [x] `ValidMKKode` map untuk O(1) lookup
  - [x] `MKByKode` map untuk ambil detail MK
  - [x] `MaxSKS = 24` constant

### 3.2 Database
- [x] `database/database.go`
  - [x] Fungsi `Connect(cfg *config.Config) *gorm.DB`
  - [x] PostgreSQL connection via `gorm.io/driver/postgres`
  - [x] Connection pool: `SetMaxOpenConns(25)`, `SetMaxIdleConns(5)`, `SetConnMaxLifetime(5 * time.Minute)`
  - [x] `db.AutoMigrate` → SKIP (pakai database Supabase yang sudah ada)
  - [x] Ping test saat startup

### 3.3 Models
- [x] `models/models.go`
  - [x] Struct `Admin` (id UUID, email, password_hash, created_at)
  - [x] Struct `Dosen` (id UUID, nama, nidn, email, password_hash, no_telp, timestamps)
  - [x] Struct `Mahasiswa` (id UUID, nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah JSONB, timestamps)
  - [x] Custom type `MataKuliahSlice` dengan `driver.Valuer` + `sql.Scanner` untuk JSONB
  - [x] GORM tags: explicit `column:` untuk NIM/NIDN/dosen_pa_id
  - [x] Foreign key constraint `OnDelete:SET NULL` untuk dosen_pa_id
  - [x] `ToResponse()` methods pada setiap model (identik output Flask `to_dict()`)

### 3.4 Utilities
- [x] `utils/response.go`
  - [x] `SuccessResponse(c, data, message, code)` → `{"data":..., "message":"..."}`
  - [x] `ErrorResponse(c, message, code)` → `{"error":"..."}`

- [x] `utils/cache.go`
  - [x] Struct `CacheClient` dengan Upstash REST URL + token
  - [x] `GetCache(key string) interface{}`
  - [x] `SetCache(key string, value interface{}, ttl int)`
  - [x] `DeleteCache(key string)`
  - [x] `DeletePattern(prefix string)` via KEYS + DEL
  - [x] Graceful fallback: jika Redis down, return `nil` (tidak panic)
  - [x] HTTP client dengan timeout 3 detik

### 3.5 Middleware
- [x] `middleware/auth.go`
  - [x] `JWTMiddleware(cfg *config.Config)` → validate `Authorization: Bearer {token}`
  - [x] Store claims di Echo context: `c.Set("userID", id)` dan `c.Set("role", role)`
  - [x] `AdminRequired` middleware → cek `role == "admin"`, return 403 jika tidak
  - [x] `MahasiswaRequired` middleware → cek `role == "mahasiswa"`
  - [x] `DosenRequired` middleware → cek `role == "dosen"`
  - [x] Return `{"error": "Token tidak valid atau tidak ditemukan"}` saat 401
  - [x] Return `{"error": "Akses 'admin' diperlukan"}` saat 403

---

## PHASE 4 — Services (Prioritas: TINGGI)

### 4.1 Auth Service
- [x] `services/auth_service.go`
  - [x] `FindUserByEmail(db, email, role string)` → return AuthUser + error
  - [x] `VerifyPassword(password, hash string) bool`
  - [x] `HashPassword(password string) (string, error)`
  - [x] `GenerateToken(cfg, id, role, nama string) (string, error)`
  - [x] JWT claims: `sub`, `role`, `nama`, `exp`, `iat`
  - [x] Token expiry sesuai `JWT_ACCESS_TOKEN_EXPIRES` config

### 4.2 Admin Service
- [x] `services/admin_service.go`
  - [x] `GetDashboard(db *gorm.DB) (*DashboardData, error)`
    - [x] Count total mahasiswa & dosen
    - [x] Distribusi jurusan via GROUP BY query
    - [x] Rata-rata SKS: iterate mata_kuliah JSONB → hitung average
  - [x] `ListMahasiswa(db, page, perPage, search)` dengan pagination helper
  - [x] `CreateMahasiswa(db, req)` — unique NIM/email check, bcrypt hash
  - [x] `UpdateMahasiswa(db, id, req)` — partial update dengan pointer fields
  - [x] `DeleteMahasiswa(db, id)` — soft check RowsAffected
  - [x] `AssignDosenPA(db, mahasiswaID, dosenID)` — validasi kedua ID
  - [x] `ListDosen(db, page, perPage, search)` dengan pagination helper
  - [x] `CreateDosen(db, req)` — unique NIDN/email check, bcrypt hash
  - [x] `UpdateDosen(db, id, req)` — partial update dengan pointer fields
  - [x] `DeleteDosen(db, id)`

### 4.3 Mahasiswa Service
- [x] `services/mahasiswa_service.go`
  - [x] `GetKRS(db, mahasiswaID)` → KRSData (mata_kuliah, total_sks, jumlah_mk)
  - [x] `UpdateKRS(db, mahasiswaID, newKodePairs)` → KRSData + dosenPAID
    - [x] Validasi setiap kode MK via `constants.ValidMKKode`
    - [x] Cek duplikat kode
    - [x] Hitung total SKS, cek tidak melebihi `MaxSKS`
    - [x] Merge dengan data existing (preserve `nilai` yang sudah ada)

### 4.4 Dosen Service
- [x] `services/dosen_service.go`
  - [x] `GetMahasiswaBimbingan(db, dosenID)` dengan `ringkasan_krs`
  - [x] `GetDetailMahasiswaBimbingan(db, dosenID, mahasiswaID)`
    - [x] Validasi mahasiswa adalah bimbingan dosen (403 jika tidak)
    - [x] Include field `krs` (mata_kuliah, total_sks, jumlah_mk)

---

## PHASE 5 — Handlers (Prioritas: TINGGI)

### 5.1 Auth Handlers
- [x] `handlers/auth.go`
  - [x] `Login` — validasi email/password/role, response identik Flask
  - [x] `GetMe` — baca userID+role dari context, query user, tambah field `role`
  - [x] `mergeRole()` helper untuk merge role ke user dict

### 5.2 Admin Handlers
- [x] `handlers/admin.go`
  - [x] `Dashboard` — cache 600s, invalidate saat mutasi
  - [x] `ListMahasiswa` — pagination + search, cache 300s
  - [x] `CreateMahasiswa` — validasi required fields + semester range (201)
  - [x] `UpdateMahasiswa` — partial update, validasi semester range
  - [x] `DeleteMahasiswa` — 404 jika tidak ada
  - [x] `AssignDosenPA` — validasi dosen_id UUID, cache invalidation
  - [x] `ListDosen` — pagination + search, cache 300s
  - [x] `CreateDosen` — validasi required fields (201)
  - [x] `UpdateDosen` — partial update via pointer fields
  - [x] `DeleteDosen` — 404 jika tidak ada

### 5.3 Mahasiswa Handlers
- [x] `handlers/mahasiswa.go`
  - [x] `Profile` — Preload DosenPA, include_dosen=true
  - [x] `GetKRS` — return mata_kuliah + total_sks + jumlah_mk
  - [x] `UpdateKRS` — extract kode dari body, delegate ke service, invalidate cache
  - [x] `GetMKTersedia` — return constants.MataKuliahList

### 5.4 Dosen Handlers
- [x] `handlers/dosen.go`
  - [x] `Profile` — query by userID dari context
  - [x] `GetMahasiswaBimbingan` — cache 300s per dosen ID
  - [x] `GetDetailMahasiswa` — 403 jika bukan bimbingan

---

## PHASE 6 — Main & Router (Prioritas: TINGGI)

- [x] `main.go`
  - [x] Load `.env` via `godotenv` (dalam config.Load)
  - [x] Initialize config, database, cache
  - [x] Setup Echo + CORS + Logger + Recover middleware
  - [x] Custom HTTPErrorHandler (identik format Flask)
  - [x] Register semua route groups dengan middleware chain
  - [x] `/api/health` endpoint
  - [x] Graceful shutdown via `signal.NotifyContext`

---

## PHASE 7 — Testing & Validation (Prioritas: SEDANG)

### 7.1 Manual Testing
- [ ] Test semua 19 endpoint dengan Postman/Bruno
- [ ] Verifikasi response format identik dengan Flask
- [ ] Test auth flow: login → get token → hit protected endpoint
- [ ] Test cache behavior: hit endpoint 2x, verifikasi cache HIT
- [ ] Test cache invalidation: POST/PUT/DELETE lalu GET → data fresh
- [ ] Test UUID routing: `/api/admin/mahasiswa/invalid-uuid` → 400

### 7.2 Regression Testing
- [ ] Login sebagai Admin, Mahasiswa, Dosen berhasil
- [ ] Role enforcement: mahasiswa tidak bisa akses `/api/admin/*`
- [ ] KRS validation: kode invalid ditolak
- [ ] KRS validation: SKS > 24 ditolak
- [ ] KRS validation: duplikat kode ditolak
- [ ] KRS update: nilai lama ter-preserve
- [ ] Dosen tidak bisa lihat mahasiswa bukan bimbingannya (403)
- [ ] Dashboard `rata_rata_sks` akurat

### 7.3 Performance Baseline
- [ ] Catat latency Flask (sebelum migrasi) dengan k6
- [ ] Catat latency Golang (setelah migrasi)
- [ ] Bandingkan di `PERFORMANCE_COMPARISON.md`

---

## PHASE 8 — Deployment (Prioritas: TINGGI setelah Phase 3-7 selesai)

- [ ] Build Docker image lokal, verifikasi tidak error
- [ ] Push `backend-golang/` ke branch baru
- [ ] Buat service baru di Railway (jangan overwrite Flask dulu!)
- [ ] Set environment variables di Railway (copy dari Flask service)
- [ ] Deploy dan verifikasi `/api/health` response
- [ ] Test semua endpoint di production URL
- [ ] Update `CORS_ORIGINS` di Golang service dengan URL production yang benar
- [ ] Update frontend `.env` `VITE_API_URL` ke URL Golang (jika siap switch)
- [ ] Monitor Railway logs 24 jam pertama
- [ ] Setelah stable: nonaktifkan Flask service

---

## PHASE 9 — Cleanup (Prioritas: RENDAH)

- [ ] Hapus `backend/` folder Flask (setelah konfirmasi Golang stable)
- [ ] Update `README.md` utama dengan instruksi Golang
- [ ] Hapus file dokumentasi migration yang sudah tidak relevan
- [ ] Update memory di Claude (`project_krs_system.md`) dengan stack baru

---

## Urutan Priority (Summary)

```
1. Phase 2 — Scaffolding (setup dulu, baru code)
2. Phase 3.1-3.2 — Config + Database (fondasi semua yang lain)
3. Phase 3.3 — Models (dibutuhkan semua handler)
4. Phase 3.4-3.5 — Utils + Middleware (dibutuhkan handler)
5. Phase 4 — Services (business logic)
6. Phase 5 — Handlers (HTTP layer)
7. Phase 6 — Main & Router (wire everything together)
8. Phase 7 — Testing (validasi sebelum deploy)
9. Phase 8 — Deployment
10. Phase 9 — Cleanup
```

---

## Dependency Graph

```
config ──────────────────────────────┐
database ← config                    │
models ← database                    │
constants (standalone)               ↓
utils/cache ← config          middleware/auth ← config
utils/response (standalone)         ↓
services ← models + database + constants
handlers ← services + utils + middleware
main ← handlers + config + database + middleware
```
