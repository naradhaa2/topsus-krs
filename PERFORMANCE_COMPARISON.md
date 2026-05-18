# Performance Comparison: Flask vs Golang — Sistem KRS

## Ringkasan Eksekutif

Migrasi dari Flask ke Golang diperkirakan memberikan peningkatan:
- **Throughput**: 8–15× lebih tinggi (req/s)
- **Latency P99**: 3–5× lebih rendah
- **Memory usage**: 5–8× lebih rendah
- **CPU usage**: 40–60% lebih rendah pada beban yang sama

---

## 1. Perbandingan Arsitektur

### Flask (Python)
```
Request → Gunicorn (WSGI) → Flask App → Handler → SQLAlchemy → PostgreSQL
                ↕
         GIL (Global Interpreter Lock)
         — hanya 1 thread Python aktif per waktu —
```

- **Gunicorn** menjalankan beberapa worker processes untuk bypass GIL
- Setiap request **blocking**: saat query DB, thread menunggu (wasting CPU)
- Python **interpreted**: setiap baris kode di-parse runtime

### Golang
```
Request → Echo (net/http) → Handler → GORM → PostgreSQL
              ↕
         Goroutine Scheduler (M:N threading)
         — ribuan goroutine concurrent tanpa blocking —
```

- **Goroutine**: green thread yang ringan (~2KB stack awal vs ~8MB OS thread)
- **Non-blocking I/O**: saat goroutine menunggu DB query, scheduler langsung lanjutkan goroutine lain
- Golang **compiled**: binary langsung dieksekusi CPU

---

## 2. Metrik Performa (Estimasi untuk KRS Workload)

### Throughput (req/s) — endpoint GET /api/admin/mahasiswa

| Skenario | Flask + Gunicorn (4 workers) | Golang Echo |
|---|---|---|
| 10 concurrent users | ~120 req/s | ~1,200 req/s |
| 50 concurrent users | ~180 req/s | ~4,500 req/s |
| 100 concurrent users | ~200 req/s | ~8,000 req/s |
| 200 concurrent users | ~210 req/s (throttle) | ~12,000 req/s |

> Estimasi berdasarkan benchmark umum Flask vs Echo untuk CRUD PostgreSQL workload.
> Angka aktual tergantung network, DB load, dan hardware Railway.

### Latency P50/P95/P99 — endpoint POST /api/auth/login (bcrypt + DB query)

| Metrik | Flask | Golang |
|---|---|---|
| P50 (median) | ~45ms | ~12ms |
| P95 | ~120ms | ~28ms |
| P99 | ~350ms | ~65ms |
| Max | ~800ms | ~150ms |

> bcrypt cost=12 membutuhkan ~100-150ms CPU. Golang lebih efisien karena tidak ada GIL overhead.

### Memory Usage (RSS) — server idle

| | Flask + Gunicorn | Golang |
|---|---|---|
| 1 worker / 1 instance | ~80MB | ~12MB |
| 4 workers | ~280MB | ~12MB (semua request satu process) |

**Golang tidak butuh multiple workers** — satu binary bisa handle ribuan concurrent request.
Ini langsung menghemat biaya Railway karena memory footprint jauh lebih kecil.

---

## 3. Mengapa Golang Lebih Cepat

### A. Compiled vs Interpreted
```
Python:  source → bytecode → CPython interpreter → CPU
                              (overhead tiap instruksi)

Golang:  source → machine code → CPU
                  (langsung, tanpa interpreter)
```

### B. Goroutine vs Thread
```python
# Flask: blocking I/O
def get_mahasiswa():
    result = db.session.query(...)  # Thread BLOCKED sampai query selesai
    return result                   # Thread lain harus tunggu atau butuh worker baru
```

```go
// Golang: concurrent I/O via goroutine scheduler
func GetMahasiswa(c echo.Context) error {
    // Goroutine di-suspend saat query DB
    // Scheduler jalankan goroutine lain
    // Resume otomatis saat hasil query tiba
    var list []models.Mahasiswa
    db.Find(&list)  // non-blocking dari perspektif aplikasi
    return c.JSON(200, list)
}
```

### C. Memory per Request
```
Flask request:  ~500KB-1MB (Python objects, SQLAlchemy session, etc)
Golang request: ~8KB-50KB (goroutine stack + struct allocation)
```

### D. Connection Pool Efficiency
```
Flask SQLAlchemy: pool_size=5, max_overflow=10 (15 total connections)
→ Setiap worker punya pool sendiri → 4 workers = 60 connections total

Golang GORM: SetMaxOpenConns(25), SetMaxIdleConns(5)
→ Satu process, satu pool → 25 connections total untuk ribuan goroutine
```

---

## 4. Area Spesifik Sistem KRS

### Dashboard (GET /api/admin/dashboard)
| Operasi | Flask | Golang |
|---|---|---|
| Cache HIT | ~5ms | ~1ms |
| Cache MISS (query DB) | ~80ms | ~15ms |
| Kalkulasi rata-rata SKS (iterasi JSONB) | ~20ms per 1000 mahasiswa | ~2ms per 1000 mahasiswa |

**Rata-rata SKS calculation** adalah bottleneck di Flask karena iterasi Python per objek.
Di Golang, iterasi struct lebih cepat ~10× untuk data yang sama.

### KRS Update (PUT /api/mahasiswa/krs)
Melibatkan: JWT validation → DB query → JSONB validation → DB write → Cache invalidate

| | Flask | Golang |
|---|---|---|
| Total latency | ~80ms | ~18ms |
| JSON marshaling | ~3ms | ~0.3ms |

### Concurrent Admin Operations
Skenario: 20 admin login bersamaan + 50 mahasiswa update KRS bersamaan

| | Flask (4 workers) | Golang |
|---|---|---|
| Request queue depth | Tinggi (bottleneck) | Minimal |
| Response time degradation | +300% | +15% |
| Error rate | ~2% (504 timeout) | ~0% |

---

## 5. Trade-offs

### Kelebihan Golang untuk KRS

| Aspek | Detail |
|---|---|
| Cold start | ~50ms vs ~2s Flask (Railway restart lebih cepat) |
| Memory | 12MB vs 280MB (hemat biaya Railway) |
| Concurrency | Handle 10,000 concurrent req dengan 1 binary |
| Type safety | Compile-time error, bukan runtime |
| Binary deployment | Tidak butuh pip install, tidak ada dependency hell |

### Kekurangan / Tantangan

| Aspek | Detail |
|---|---|
| Verbosity | Code lebih panjang (error handling eksplisit) |
| Ekosistem | Library lebih sedikit dari Python |
| Learning curve | Syntax berbeda, perlu adaptasi |
| JSONB handling | Lebih verbose dari SQLAlchemy Python |
| Development speed | Lebih lambat untuk prototyping |

### Kesimpulan untuk KRS

Sistem KRS adalah **read-heavy** (list mahasiswa, KRS view, dashboard) dengan **occasional writes** (update KRS, CRUD admin). Pattern ini sangat cocok untuk Golang karena:

1. Read endpoints dengan caching → Golang jauh lebih efisien
2. Concurrent mahasiswa submit KRS saat deadline → Golang tidak akan bottleneck
3. Railway deployment → Memory savings langsung = cost savings

Performa Flask yang ada **sudah cukup** untuk beban normal KRS (ratusan mahasiswa).
Golang memberikan **headroom 10-15×** untuk pertumbuhan tanpa perlu scale up server.

---

## 6. Benchmark Tools (untuk verifikasi setelah migrasi)

```bash
# Install wrk
# Windows: gunakan WSL atau k6

# Load test
k6 run --vus 50 --duration 30s script.js

# Contoh k6 script:
# GET /api/admin/mahasiswa dengan JWT token
```

Metrik yang perlu dicompare setelah migrasi:
- `http_req_duration` (P50, P95, P99)
- `http_reqs` (total request per second)
- Memory usage Railway (lihat di dashboard Railway)
