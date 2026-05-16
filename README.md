# Sistem KRS — Kartu Rencana Studi

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)
![Render](https://img.shields.io/badge/Frontend-Render-46E3B7?logo=render&logoColor=white)
![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?logo=railway&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)

Aplikasi web manajemen Kartu Rencana Studi (KRS) untuk perguruan tinggi, dengan 3 peran pengguna: **Admin**, **Mahasiswa**, dan **Dosen Pembimbing Akademik**.

---

## Fitur per Role

### Admin
- Dashboard statistik (total mahasiswa, dosen, rata-rata SKS, distribusi jurusan)
- Manajemen mahasiswa (CRUD lengkap + pagination + search)
- Manajemen dosen (CRUD lengkap)
- Pemetaan Dosen PA — assign mahasiswa ke dosen secara batch atau per-baris

### Mahasiswa
- Lihat profil lengkap + info Dosen PA
- Pilih mata kuliah (KRS) dari 12 MK tersedia
- Validasi otomatis batas maksimal 24 SKS
- Progress bar SKS real-time

### Dosen Pembimbing Akademik
- Lihat profil dosen
- Daftar mahasiswa bimbingan dengan ringkasan KRS
- Detail KRS per mahasiswa (kode, nama MK, SKS, nilai)

---

## Tech Stack

| Layer     | Teknologi                                      |
|-----------|------------------------------------------------|
| Frontend  | React 18 + Vite, TailwindCSS, React Router v6  |
| Backend   | Python Flask 3, SQLAlchemy, Flask-JWT-Extended  |
| Database  | PostgreSQL 17 via Supabase                     |
| Caching   | Redis via Upstash (REST API)                   |
| Auth      | JWT (Bearer token, bcrypt password hashing)    |
| Hosting   | Render (frontend) + Railway (backend)          |

---

## Akun Demo (dari seed data)

| Role      | Email                           | Password   |
|-----------|---------------------------------|------------|
| Admin     | admin@krs.ac.id                 | Admin123!  |
| Dosen     | budi.santoso@krs.ac.id          | Dosen123!  |
| Dosen     | sari.dewi@krs.ac.id             | Dosen123!  |
| Dosen     | andi.wijaya@krs.ac.id           | Dosen123!  |
| Mahasiswa | andi.prasetyo@student.krs.ac.id | Mhs123!    |
| Mahasiswa | budi.rahmat@student.krs.ac.id   | Mhs123!    |
| Mahasiswa | citra.lestari@student.krs.ac.id | Mhs123!    |

*(semua mahasiswa menggunakan password yang sama: Mhs123!)*

---

## Struktur Folder

```
Topsus-KRS-Fix/
├── backend/                  # Flask API
│   ├── app.py                # Entry point
│   ├── config.py             # Konfigurasi env vars
│   ├── models.py             # SQLAlchemy models
│   ├── constants.py          # Daftar 12 mata kuliah
│   ├── requirements.txt
│   ├── Procfile              # Untuk Railway/Heroku
│   ├── railway.json          # Konfigurasi Railway
│   ├── runtime.txt           # Versi Python
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py           # POST /login, GET /me
│   │   ├── admin.py          # CRUD mahasiswa, dosen, pemetaan PA
│   │   ├── mahasiswa.py      # Profile, KRS
│   │   └── dosen.py          # Profile, mahasiswa bimbingan
│   └── utils/
│       ├── cache.py          # Upstash Redis wrapper
│       ├── decorators.py     # JWT role decorators
│       └── helpers.py        # Response helpers
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── App.jsx           # Routing utama
│   │   ├── context/          # AuthContext (JWT state)
│   │   ├── services/         # Axios instance + interceptors
│   │   ├── components/       # Komponen reusable
│   │   └── pages/            # Halaman per role
│   ├── public/
│   │   └── _redirects        # Konfigurasi SPA untuk Render
│   ├── package.json
│   └── .env.example
│
├── migration.sql             # Schema database
├── seed.sql                  # Data awal testing
├── render.yaml               # Render Blueprint
├── deployment_guide.md       # Panduan deploy lengkap
└── README.md                 # File ini
```

---

## Setup Lokal (Development)

Lihat [`deployment_guide.md`](./deployment_guide.md) untuk panduan lengkap.

**Ringkasan cepat:**

```bash
# 1. Clone repository
git clone https://github.com/username/krs-system.git
cd krs-system

# 2. Setup backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# isi DATABASE_URL, JWT_SECRET_KEY, dll
flask run

# 3. Setup frontend (terminal baru)
cd frontend
npm install
cp .env.example .env
# isi VITE_API_URL=http://localhost:5000
npm run dev
```

---

## Deployment

Panduan lengkap deployment ke cloud (Supabase + Upstash + Railway + Render) ada di:

**[📖 deployment_guide.md](./deployment_guide.md)**

Estimasi total waktu: ~80 menit (tidak termasuk registrasi akun).

---

## API Endpoints

| Method | Endpoint                              | Role      | Deskripsi                    |
|--------|---------------------------------------|-----------|------------------------------|
| POST   | /api/auth/login                       | Semua     | Login & dapat JWT token      |
| GET    | /api/auth/me                          | Semua     | Data profil saat ini         |
| GET    | /api/admin/dashboard                  | Admin     | Statistik dashboard          |
| GET    | /api/admin/mahasiswa                  | Admin     | List mahasiswa (paginated)   |
| POST   | /api/admin/mahasiswa                  | Admin     | Tambah mahasiswa             |
| PUT    | /api/admin/mahasiswa/:id              | Admin     | Update mahasiswa             |
| DELETE | /api/admin/mahasiswa/:id              | Admin     | Hapus mahasiswa              |
| PUT    | /api/admin/mahasiswa/:id/dosen-pa     | Admin     | Assign dosen PA              |
| GET    | /api/admin/dosen                      | Admin     | List dosen (paginated)       |
| POST   | /api/admin/dosen                      | Admin     | Tambah dosen                 |
| PUT    | /api/admin/dosen/:id                  | Admin     | Update dosen                 |
| DELETE | /api/admin/dosen/:id                  | Admin     | Hapus dosen                  |
| GET    | /api/mahasiswa/profile                | Mahasiswa | Profil + info dosen PA       |
| GET    | /api/mahasiswa/krs                    | Mahasiswa | Data KRS aktif               |
| PUT    | /api/mahasiswa/krs                    | Mahasiswa | Update KRS                   |
| GET    | /api/mahasiswa/mata-kuliah-tersedia   | Mahasiswa | Daftar 12 MK                 |
| GET    | /api/dosen/profile                    | Dosen     | Profil dosen                 |
| GET    | /api/dosen/mahasiswa-bimbingan        | Dosen     | List mahasiswa bimbingan     |
| GET    | /api/dosen/mahasiswa-bimbingan/:id    | Dosen     | Detail KRS mahasiswa         |

---

## Lisensi

MIT License — bebas digunakan untuk keperluan akademik dan pembelajaran.
