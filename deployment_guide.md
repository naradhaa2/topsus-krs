# Panduan Deployment Sistem KRS
### Supabase · Upstash · Railway · Render
**Estimasi total waktu: ~80 menit**
Semua langkah dapat dilakukan hanya dari browser — tidak perlu terminal.

---

## Daftar Isi

- [Tahap A — Persiapan GitHub](#tahap-a--persiapan-github-10-menit)
- [Tahap B — Setup Supabase](#tahap-b--setup-supabase-15-menit)
- [Tahap C — Setup Upstash Redis](#tahap-c--setup-upstash-redis-10-menit)
- [Tahap D — Deploy Backend ke Railway](#tahap-d--deploy-backend-ke-railway-20-menit)
- [Tahap E — Deploy Frontend ke Render](#tahap-e--deploy-frontend-ke-render-20-menit)
- [Tahap F — Konfigurasi Akhir](#tahap-f--konfigurasi-akhir-5-menit)
- [Troubleshooting](#troubleshooting)
- [Catatan Penting Free Tier](#catatan-penting-free-tier)

---

## Tahap A — Persiapan GitHub (10 menit)

> **Mengapa GitHub?** Railway dan Render terhubung ke GitHub. Setiap kali kamu
> push perubahan ke GitHub, aplikasi otomatis di-deploy ulang.

### A1. Buat Akun GitHub

1. Buka [github.com](https://github.com) di browser
2. Klik **Sign up** di pojok kanan atas
3. Isi email, password, dan username
4. Verifikasi email yang dikirim GitHub
5. Pilih plan **Free**

### A2. Buat Repository Baru

1. Setelah login, klik tombol **+** di pojok kanan atas → **New repository**
2. Isi form:
   - **Repository name**: `krs-system` (atau nama lain, tanpa spasi)
   - **Description**: `Sistem Kartu Rencana Studi`
   - **Visibility**: `Public` *(Railway & Render free tier memerlukan repo publik)*
   - Centang **Add a README file**
3. Klik **Create repository**

📸 *[Screenshot: Form pembuatan repository GitHub dengan kolom yang sudah diisi]*

### A3. Upload File via GitHub Web Interface

> **Cara paling mudah** untuk pengguna baru: drag & drop langsung ke browser.

1. Di halaman repository yang baru dibuat, klik **Add file** → **Upload files**
2. Buka folder project `Topsus-KRS-Fix` di komputer kamu
3. Pilih **semua file dan folder** di dalam folder project (Ctrl+A)
4. Drag & drop ke area upload di browser GitHub
5. Tunggu hingga semua file terupload (bisa beberapa menit jika besar)
6. Di bagian bawah, isi **Commit message**: `Initial commit — Sistem KRS`
7. Pastikan pilihan **Commit directly to the main branch** dipilih
8. Klik **Commit changes**

📸 *[Screenshot: Area drag & drop upload GitHub, dengan file sudah di-drop]*

⚠️ **Jangan lupa:** Pastikan struktur folder di GitHub terlihat seperti ini:
```
krs-system/
├── backend/
├── frontend/
├── migration.sql
├── seed.sql
├── README.md
├── render.yaml
└── deployment_guide.md
```

### A4. Alternatif: GitHub Desktop (Lebih Mudah untuk Banyak File)

Jika file terlalu banyak untuk drag & drop:

1. Download **GitHub Desktop** dari [desktop.github.com](https://desktop.github.com)
2. Install dan login dengan akun GitHub
3. Klik **Clone a repository** → pilih repository `krs-system` yang baru dibuat
4. Pilih lokasi folder di komputer → klik **Clone**
5. Buka folder yang baru di-clone, hapus `README.md` yang ada
6. Copy semua file project KRS ke folder itu
7. Kembali ke GitHub Desktop — perubahan akan terdeteksi otomatis
8. Di bagian kiri bawah, isi **Summary**: `Initial commit`
9. Klik **Commit to main** → lalu klik **Push origin**

📸 *[Screenshot: GitHub Desktop dengan list perubahan file dan tombol Commit]*

---

## Tahap B — Setup Supabase (15 menit)

> **Supabase** adalah platform database PostgreSQL gratis yang kita pakai
> untuk menyimpan data mahasiswa, dosen, dan KRS.

### B1. Buat Akun Supabase

1. Buka [supabase.com](https://supabase.com)
2. Klik **Start your project** → **Sign Up**
3. Disarankan: login dengan **Continue with GitHub** (lebih cepat)

### B2. Buat Project Baru

1. Setelah masuk dashboard, klik **New project**
2. Isi form:
   - **Organization**: biarkan default (nama akun kamu)
   - **Project name**: `krs-system`
   - **Database Password**: buat password kuat (min 16 karakter)
     ⚠️ **Jangan lupa catat password ini!** Akan dibutuhkan di Tahap D
   - **Region**: `Southeast Asia (Singapore)` — pilih ini agar latensi rendah dari Indonesia
3. Klik **Create new project**
4. Tunggu 1-2 menit hingga status berubah menjadi **Active** (hijau)

📸 *[Screenshot: Form pembuatan project Supabase dengan region Singapore dipilih]*

### B3. Jalankan migration.sql

1. Di sidebar kiri, klik **SQL Editor** (ikon database)
2. Klik **New query** (tombol + di atas kiri)
3. Buka file `migration.sql` dari folder project (buka dengan Notepad atau text editor apapun)
4. Tekan **Ctrl+A** untuk pilih semua → **Ctrl+C** untuk copy
5. Klik di area editor SQL Supabase → tekan **Ctrl+V** untuk paste
6. Klik tombol **Run** (atau tekan **Ctrl+Enter**)
7. Pastikan output di bagian bawah menampilkan: **Success. No rows returned**

📸 *[Screenshot: SQL Editor Supabase dengan kode migration dan output "Success"]*

⚠️ **Jika muncul error** `type "role_enum" already exists`:
Jalankan dulu perintah ini di SQL Editor baru, lalu ulangi migration:
```sql
DROP TYPE IF EXISTS role_enum CASCADE;
```

### B4. Jalankan seed.sql

1. Buka **New query** lagi di SQL Editor
2. Copy isi file `seed.sql` → paste ke editor
3. Klik **Run**
4. Verifikasi di **Table Editor** (ikon grid di sidebar): harus ada 3 tabel dengan data

📸 *[Screenshot: Table Editor Supabase menampilkan tabel mahasiswa dengan 10 baris data]*

⚠️ **Catatan password hash:** Hash bcrypt di seed.sql adalah pre-computed.
Jika login gagal, lihat bagian Troubleshooting.

### B5. Ambil DATABASE_URL

1. Di sidebar, klik **Settings** (ikon gear di bawah) → **Database**
2. Scroll ke bagian **Connection string**
3. Klik tab **Transaction** ← *PENTING: pilih Transaction, bukan Session atau URI*
4. Copy string yang muncul (format: `postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres`)
5. Ganti `[YOUR-PASSWORD]` dengan password database yang dibuat di B2
6. Simpan string ini — akan dipakai di Tahap D

📸 *[Screenshot: Halaman Database Settings Supabase, tab Transaction dipilih]*

⚠️ **Mengapa Transaction mode?** Railway menggunakan connection pooling.
Mode Transaction lebih stabil untuk server yang tidak persistent.

### B6. Ambil SUPABASE_URL dan SUPABASE_ANON_KEY

1. Di Settings, pilih **API**
2. Di bagian **Project URL**, copy URL (format: `https://xxx.supabase.co`)
3. Di bagian **Project API keys**, copy nilai **anon / public**
4. Simpan keduanya (dibutuhkan jika frontend perlu akses langsung ke Supabase)

---

## Tahap C — Setup Upstash Redis (10 menit)

> **Upstash** adalah layanan Redis gratis untuk caching. Kita pakai untuk
> mempercepat response API (dashboard, daftar mahasiswa, dll).

### C1. Buat Akun Upstash

1. Buka [upstash.com](https://upstash.com)
2. Klik **Sign Up** → pilih **Continue with GitHub** (lebih cepat)
3. Authorize akses GitHub → masuk ke dashboard

### C2. Buat Database Redis

1. Di dashboard, klik **Create Database**
2. Isi form:
   - **Name**: `krs-cache`
   - **Type**: `Regional` *(bukan Global — Regional lebih hemat untuk free tier)*
   - **Region**: `ap-southeast-1` (Singapore)
   - **Eviction**: biarkan default (disabled)
3. Klik **Create**

📸 *[Screenshot: Form pembuatan database Upstash dengan region Singapore]*

### C3. Ambil Credentials Redis

1. Setelah database terbuat, klik nama database `krs-cache`
2. Pilih tab **REST API**
3. Copy nilai:
   - **UPSTASH_REDIS_REST_URL** (format: `https://xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (string panjang)
4. Simpan keduanya untuk Tahap D

📸 *[Screenshot: Tab REST API di Upstash dengan URL dan Token terlihat]*

---

## Tahap D — Deploy Backend ke Railway (20 menit)

> **Railway** adalah platform hosting untuk aplikasi backend (Flask API kita).
> Railway menjalankan server Python dan melayani request dari frontend.

### D1. Buat Akun Railway

1. Buka [railway.app](https://railway.app)
2. Klik **Login** → **Login with GitHub**
3. Authorize akses GitHub → masuk ke dashboard Railway

### D2. Buat Project Baru

1. Di dashboard Railway, klik **New Project**
2. Pilih **Deploy from GitHub repo**
3. Klik **Configure GitHub App** jika diminta → install Railway di akun GitHub kamu
4. Pilih repository `krs-system` dari daftar

📸 *[Screenshot: Halaman "Deploy from GitHub repo" Railway dengan daftar repository]*

### D3. Konfigurasi Root Directory

> ⚠️ **LANGKAH KRITIS** — Jangan dilewati!

1. Setelah project dibuat, klik service yang muncul
2. Pergi ke tab **Settings**
3. Di bagian **Source** → cari **Root Directory**
4. Isi dengan: `backend`
5. Klik **Save** atau tekan Enter
6. Railway akan otomatis re-deploy dari folder `backend`

📸 *[Screenshot: Settings Railway dengan kolom Root Directory diisi "backend"]*

### D4. Tambahkan Environment Variables

1. Klik tab **Variables**
2. Klik **New Variable** dan tambahkan satu per satu:

| Variable Name | Nilai |
|---|---|
| `DATABASE_URL` | Connection string dari Supabase B5 (mode Transaction) |
| `JWT_SECRET_KEY` | String acak panjang (lihat cara generate di bawah) |
| `JWT_ACCESS_TOKEN_EXPIRES` | `3600` |
| `UPSTASH_REDIS_REST_URL` | URL dari Upstash C3 |
| `UPSTASH_REDIS_REST_TOKEN` | Token dari Upstash C3 |
| `CORS_ORIGINS` | `http://localhost:5173` *(sementara, akan diupdate di Tahap F)* |

📸 *[Screenshot: Tab Variables Railway dengan semua environment variable sudah diisi]*

**Cara generate JWT_SECRET_KEY tanpa terminal:**
1. Buka [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
2. Copy string yang muncul (32 karakter acak)
3. Paste sebagai nilai `JWT_SECRET_KEY`

⚠️ **Jangan gunakan** string pendek atau mudah ditebak untuk JWT_SECRET_KEY!

### D5. Tunggu Deploy Selesai

1. Klik tab **Deployments**
2. Tunggu hingga status berubah dari **Building** → **Success** (2–5 menit)
3. Jika status **Failed**, klik deployment tersebut untuk melihat log error

📸 *[Screenshot: Tab Deployments Railway dengan status "Success" berwarna hijau]*

### D6. Dapatkan URL Backend

1. Klik tab **Settings** → bagian **Networking**
2. Klik **Generate Domain**
3. Railway akan membuat URL public (format: `xxx.up.railway.app`)
4. **Copy URL ini** — akan dipakai di Tahap E dan F

### D7. Test Backend

1. Buka URL backend di browser: `https://xxx.up.railway.app/api/health`
2. Harus muncul response JSON: `{"status": "ok"}`
3. Jika muncul halaman Railway (bukan JSON), tunggu 1 menit dan refresh

📸 *[Screenshot: Browser menampilkan JSON response dari endpoint /api/health]*

---

## Tahap E — Deploy Frontend ke Render (20 menit)

> **Render Static Site** adalah layanan hosting gratis untuk aplikasi React.
> **PENTING:** Pilih **Static Site**, bukan Web Service!
>
> | | Static Site | Web Service |
> |---|---|---|
> | Harga | Gratis selamanya | Gratis (spin down 15 menit) |
> | Cocok untuk | React, Vue, HTML/CSS | Node.js, Python API |
> | Spin down? | ❌ Tidak | ✅ Ya (loading 30-60 detik) |

### E1. Buat Akun Render

1. Buka [render.com](https://render.com)
2. Klik **Get Started for Free**
3. Pilih **Continue with GitHub** → authorize akses

### E2. Buat Static Site

1. Di dashboard Render, klik **New +** di pojok kanan atas
2. Pilih **Static Site** *(bukan Web Service!)*
3. Pilih **Connect a repository** → pilih repo `krs-system`
4. Jika tidak muncul, klik **Configure account** untuk beri akses repository

📸 *[Screenshot: Pilihan "New +" Render dengan "Static Site" disorot]*

### E3. Konfigurasi Build

Isi form konfigurasi:

| Field | Nilai |
|---|---|
| **Name** | `krs-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` ← WAJIB diisi |
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

📸 *[Screenshot: Form konfigurasi Render Static Site dengan semua field sudah diisi]*

⚠️ **Jangan lupa** isi Root Directory dengan `frontend`! Tanpa ini, build akan gagal.

### E4. Tambahkan Environment Variable

1. Scroll ke bawah, klik **Advanced**
2. Klik **Add Environment Variable**
3. Tambahkan:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://xxx.up.railway.app` *(URL Railway dari Tahap D6)*
4. Klik **Create Static Site**

📸 *[Screenshot: Section Environment Variables Render dengan VITE_API_URL sudah diisi]*

⚠️ **Mengapa perlu prefix VITE_?** Vite hanya menyertakan environment variable
yang diawali `VITE_` ke dalam bundle JavaScript. Tanpa prefix ini, nilai tidak terbaca.

### E5. Tunggu Build Selesai

1. Render akan otomatis mulai build (3–5 menit)
2. Klik deployment yang sedang berjalan untuk melihat log build
3. Tunggu hingga status **Live** dengan tanda centang hijau

📸 *[Screenshot: Log build Render menampilkan "Build successful" dan "Deploying"]*

### E6. Dapatkan URL Frontend

1. Di halaman service `krs-frontend`, copy URL di bagian atas
2. Format: `https://krs-frontend.onrender.com` (atau nama yang kamu pilih)

### E7. Konfigurasi Redirect untuk React Router

> File `_redirects` sudah ada di `frontend/public/` dan akan otomatis disertakan
> saat build. File ini memastikan React Router bekerja saat user me-refresh halaman.

Verifikasi: setelah build selesai, buka URL Render → navigasi ke halaman manapun
→ refresh browser → halaman tidak boleh menampilkan 404.

---

## Tahap F — Konfigurasi Akhir (5 menit)

### F1. Update CORS di Railway

> CORS (Cross-Origin Resource Sharing) adalah pengamanan browser yang mengatur
> domain mana yang boleh mengakses API. Kita perlu izinkan URL Render.

1. Kembali ke Railway dashboard → project KRS → tab **Variables**
2. Klik nilai `CORS_ORIGINS` yang sudah ada → edit
3. Ganti dengan URL Render: `https://krs-frontend.onrender.com`
4. Tekan Enter / Save
5. Railway otomatis redeploy (1–2 menit)

📸 *[Screenshot: Variable CORS_ORIGINS Railway diupdate dengan URL Render]*

### F2. Test Login

1. Buka URL Render: `https://krs-frontend.onrender.com`
2. Test login dengan akun berikut:

| Role | Email | Password |
|---|---|---|
| Admin | admin@krs.ac.id | Admin123! |
| Mahasiswa | andi.prasetyo@student.krs.ac.id | Mhs123! |
| Dosen | budi.santoso@krs.ac.id | Dosen123! |

3. Pastikan setiap role bisa login dan melihat halaman yang sesuai

📸 *[Screenshot: Halaman login Sistem KRS di URL Render dengan tab role terlihat]*

### F3. Verifikasi Fungsionalitas

Cek satu per satu:
- [ ] Login Admin → Dashboard menampilkan data statistik
- [ ] Admin → Manajemen Mahasiswa menampilkan 10 mahasiswa
- [ ] Admin → Pemetaan PA menampilkan dosen dan mahasiswa
- [ ] Login Mahasiswa → Profile menampilkan info dosen PA
- [ ] Mahasiswa → KRS menampilkan 12 mata kuliah tersedia
- [ ] Login Dosen → Mahasiswa Bimbingan menampilkan daftar
- [ ] Dosen → klik mahasiswa → Detail KRS terbuka

---

## Troubleshooting

| # | Masalah | Penyebab | Solusi |
|---|---------|----------|--------|
| 1 | **CORS error** di browser (Network tab: "Access-Control-Allow-Origin") | CORS_ORIGINS belum diset ke URL Render | Update variable CORS_ORIGINS di Railway dengan URL Render yang benar. Pastikan tidak ada trailing slash. |
| 2 | **500 Internal Server Error** saat login | Hash bcrypt di seed tidak cocok dengan library | Lihat log Railway → jika error bcrypt, regenerate hash. Panduan ada di seed.sql. |
| 3 | **Redis connection timeout** di log Railway | Upstash URL/Token salah atau region tidak support | Verifikasi copy-paste UPSTASH_REDIS_REST_URL dan TOKEN. Coba buat database Upstash baru jika perlu. |
| 4 | **Render build gagal**: `npm not found` | Root Directory tidak diset ke `frontend` | Di Settings Render, pastikan Root Directory = `frontend` (huruf kecil semua). |
| 5 | **React Router 404** saat refresh halaman di Render | File `_redirects` tidak ada di `dist/` | Pastikan file `frontend/public/_redirects` ada di repository dan sudah di-commit ke GitHub. |
| 6 | **Railway build gagal**: `Module 'flask' not found` | Root Directory tidak diset ke `backend` | Di Settings Railway → Source → Root Directory = `backend`. |
| 7 | **Supabase "too many connections"** | Menggunakan direct connection, bukan pooler | Ganti DATABASE_URL ke mode **Transaction** (port 6543) dari Settings > Database > Connection String > Transaction. |
| 8 | **401 Unauthorized loop** — terus redirect ke login | JWT_SECRET_KEY berubah setelah redeploy | Pastikan JWT_SECRET_KEY sama di semua deploy. Jangan regenerate setelah ada user login. |
| 9 | **VITE_API_URL tidak terbaca** — API tidak terpanggil | Prefix VITE_ hilang atau belum rebuild | Pastikan key-nya persis `VITE_API_URL` (huruf kapital semua). Setelah set env var, trigger manual deploy ulang di Render. |
| 10 | **Login berhasil tapi data kosong** | CORS lolos tapi backend tidak konek database | Cek log Railway untuk error SQLAlchemy. Verifikasi DATABASE_URL menggunakan mode Transaction. |
| 11 | **Render "site not found"** setelah deploy | Build berhasil tapi Publish Directory salah | Pastikan Publish Directory = `dist` (bukan `build` atau `/dist`). |
| 12 | **Railway error**: `gunicorn: command not found` | requirements.txt tidak terinclude atau gagal install | Cek log build Railway. Pastikan `gunicorn` ada di `requirements.txt`. |

---

## Catatan Penting Free Tier

### Railway (Backend)
- **Free tier**: $5 credit per bulan (cukup untuk ~500 jam)
- Jika credit habis, service akan suspended
- Untuk proyek akademik, $5/bulan biasanya cukup
- **Tips**: Set sleep mode di Settings jika tidak digunakan aktif

### Render (Frontend)
- **Static Site**: Gratis selamanya, tidak ada spin down
- Build time: ~3-5 menit per deploy
- Bandwidth: 100 GB/bulan (sangat cukup)

### Supabase (Database)
- **Free tier**: 500 MB storage, 2 project aktif
- Proyek tidak aktif (>90 hari) akan di-pause otomatis
- Jika di-pause: masuk dashboard Supabase → klik "Restore project"

### Upstash (Redis)
- **Free tier**: 10,000 commands/hari, 256 MB storage
- Lebih dari itu akan diblokir sementara (reset setiap hari)
- Untuk proyek kecil, ini sangat mencukupi

---

## Alur Deployment Ulang (Update Kode)

Setiap kali ada perubahan kode:

1. Upload file yang berubah ke GitHub (via web interface atau GitHub Desktop)
2. **Railway** otomatis deteksi perubahan → redeploy backend (~2 menit)
3. **Render** otomatis deteksi perubahan → rebuild frontend (~4 menit)
4. Tidak perlu melakukan apapun lagi!

> Ini disebut **Continuous Deployment (CD)** — salah satu keunggulan
> menggunakan platform cloud modern.

---

## Ringkasan Semua URL & Credentials

Setelah menyelesaikan semua tahap, kamu akan punya:

```
DATABASE_URL          = postgresql://postgres.xxx:...@xxx.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY        = (string acak 32 karakter)
UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN = (token panjang)
CORS_ORIGINS          = https://krs-frontend.onrender.com

URL Backend (Railway) = https://xxx.up.railway.app
URL Frontend (Render) = https://krs-frontend.onrender.com
```

⚠️ **JANGAN** simpan credentials di file yang di-push ke GitHub!
Selalu gunakan fitur Environment Variables di Railway dan Render.

---

*Panduan ini dibuat untuk Sistem KRS — Tugas Akhir / Capstone Project.*
*Untuk bantuan lebih lanjut, buka issue di repository GitHub.*
