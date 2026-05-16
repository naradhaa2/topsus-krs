# Panduan Setup Supabase — Sistem KRS

## Prasyarat
- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- File `migration.sql` dan `seed.sql` sudah siap

---

## Step 1 — Buat Project Baru di Supabase

1. Login ke [app.supabase.com](https://app.supabase.com)
2. Klik **New project**
3. Isi form:
   - **Name**: `krs-system` (atau nama lain)
   - **Database Password**: buat password kuat, **simpan di tempat aman**
   - **Region**: pilih yang terdekat (misal `Southeast Asia (Singapore)`)
4. Klik **Create new project**
5. Tunggu sekitar 1-2 menit hingga project selesai provisioning (status menjadi hijau)

---

## Step 2 — Jalankan migration.sql

1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New query** (tombol `+` di pojok kiri atas)
3. Buka file `migration.sql`, copy seluruh isinya
4. Paste ke editor SQL di Supabase
5. Klik tombol **Run** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)
6. Pastikan output di panel bawah menampilkan:

   ```
   Success. No rows returned
   ```

7. Verifikasi tabel terbuat:
   - Di sidebar, buka **Table Editor**
   - Harus muncul tabel: `admin`, `dosen`, `mahasiswa`

**Jika ada error** `type "role_enum" already exists`: jalankan dulu:
```sql
DROP TYPE IF EXISTS role_enum CASCADE;
```
lalu ulangi migration.

---

## Step 3 — Jalankan seed.sql

1. Di SQL Editor, buka **New query** lagi
2. Buka file `seed.sql`, copy seluruh isinya
3. Paste ke editor dan klik **Run**
4. Output sukses:

   ```
   Success. No rows returned
   ```

5. Verifikasi data seed:
   - Buka **Table Editor > mahasiswa** — harus ada 10 baris
   - Buka **Table Editor > dosen** — harus ada 3 baris
   - Buka **Table Editor > admin** — harus ada 1 baris

6. (Opsional) Query verifikasi cepat di SQL Editor:
   ```sql
   SELECT 'admin'     AS tabel, COUNT(*) FROM admin
   UNION ALL
   SELECT 'dosen'     AS tabel, COUNT(*) FROM dosen
   UNION ALL
   SELECT 'mahasiswa' AS tabel, COUNT(*) FROM mahasiswa;
   ```

---

## Step 4 — Ambil DATABASE_URL (Connection String)

1. Di sidebar, klik **Settings** (icon gear)
2. Pilih **Database**
3. Scroll ke bagian **Connection string**
4. Pilih tab **URI**
5. Copy string yang terlihat seperti:

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
   ```

6. Ganti `[YOUR-PASSWORD]` dengan password database yang Anda buat di Step 1
7. Simpan sebagai `DATABASE_URL` di file `.env`:

   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@db.abcdefgh.supabase.co:5432/postgres
   ```

> **Untuk koneksi via connection pooler** (direkomendasikan untuk production):
> Gunakan tab **Session** atau **Transaction** di bagian Connection Pooling.
> Port pooler adalah `6543`, bukan `5432`.

---

## Step 5 — Ambil SUPABASE_URL dan SUPABASE_ANON_KEY

1. Di sidebar, klik **Settings**
2. Pilih **API**
3. Di bagian **Project URL**, copy URL yang terlihat seperti:

   ```
   https://abcdefghijklmnop.supabase.co
   ```

4. Di bagian **Project API keys**, copy nilai **anon / public**:

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. Simpan keduanya di file `.env`:

   ```env
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> **Jangan pernah expose `service_role` key** ke frontend.
> `anon` key aman untuk client-side jika Row Level Security (RLS) dikonfigurasi.

---

## Contoh Lengkap File .env

```env
# Supabase
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct DB connection (untuk backend/ORM seperti Prisma/Drizzle)
DATABASE_URL=postgresql://postgres:yourpassword@db.abcdefgh.supabase.co:5432/postgres
```

---

## Akun Testing (dari seed.sql)

| Role      | Email                              | Password   |
|-----------|------------------------------------|------------|
| Admin     | admin@krs.ac.id                    | Admin123!  |
| Dosen     | budi.santoso@krs.ac.id             | Dosen123!  |
| Dosen     | sari.dewi@krs.ac.id                | Dosen123!  |
| Dosen     | andi.wijaya@krs.ac.id              | Dosen123!  |
| Mahasiswa | andi.prasetyo@student.krs.ac.id    | Mhs123!    |
| Mahasiswa | budi.rahmat@student.krs.ac.id      | Mhs123!    |
| Mahasiswa | citra.lestari@student.krs.ac.id    | Mhs123!    |
| Mahasiswa | dewi.anggraini@student.krs.ac.id   | Mhs123!    |
| Mahasiswa | eko.setiawan@student.krs.ac.id     | Mhs123!    |
| Mahasiswa | fitri.handayani@student.krs.ac.id  | Mhs123!    |
| Mahasiswa | gilang.nugroho@student.krs.ac.id   | Mhs123!    |
| Mahasiswa | hana.kusuma@student.krs.ac.id      | Mhs123!    |
| Mahasiswa | irwan.fauzi@student.krs.ac.id      | Mhs123!    |
| Mahasiswa | joko.widyatmoko@student.krs.ac.id  | Mhs123!    |

---

## Catatan Penting: Password Hash

Hash bcrypt di `seed.sql` di-pre-compute dengan cost factor 12.
Jika backend Anda menggunakan library bcrypt yang berbeda versi, hash mungkin tidak cocok.
Regenerate hash dengan perintah berikut sesuai bahasa backend:

**Node.js (bcrypt / bcryptjs)**
```js
const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync('Admin123!', 12));
console.log(bcrypt.hashSync('Dosen123!', 12));
console.log(bcrypt.hashSync('Mhs123!', 12));
```

**Python (bcrypt)**
```python
import bcrypt
print(bcrypt.hashpw(b'Admin123!', bcrypt.gensalt(12)).decode())
print(bcrypt.hashpw(b'Dosen123!', bcrypt.gensalt(12)).decode())
print(bcrypt.hashpw(b'Mhs123!',   bcrypt.gensalt(12)).decode())
```

Ganti nilai `password_hash` di `seed.sql` dengan output dari perintah di atas,
lalu jalankan ulang seed.

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `type "role_enum" already exists` | Jalankan `DROP TYPE IF EXISTS role_enum CASCADE;` lalu ulangi migration |
| `relation "dosen" already exists` | Tabel sudah ada. Jalankan `DROP TABLE IF EXISTS mahasiswa, dosen, admin CASCADE;` lalu ulangi |
| `ERROR: invalid input value for enum` | Pastikan nilai kolom sesuai enum: `'admin'`, `'dosen'`, `'mahasiswa'` |
| `ERROR: extension "pgcrypto" already exists` | Abaikan, atau hapus baris `CREATE EXTENSION` di migration |
| Seed berhasil tapi login gagal | Regenerate hash bcrypt seperti di bagian Catatan Penting di atas |
