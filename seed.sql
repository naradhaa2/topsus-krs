-- ============================================================
-- KRS SYSTEM — SEED DATA (Development / Testing)
-- Jalankan SETELAH migration.sql berhasil dieksekusi.
--
-- PASSWORD PLAINTEXT (untuk login testing):
--   Admin   : Admin123!
--   Dosen   : Dosen123!
--   Mahasiswa: Mhs123!
--
-- Hash di bawah adalah bcrypt (cost=12) yang di-pre-compute
-- menggunakan library bcrypt standar. Jika backend Anda
-- menggunakan library berbeda, regenerate hash dengan:
--   Node.js : bcrypt.hashSync('Admin123!', 12)
--   Python  : bcrypt.hashpw(b'Admin123!', bcrypt.gensalt(12))
-- ============================================================

-- ------------------------------------------------------------
-- SECTION 1: KONSTANTA MATA KULIAH (referensi internal seed)
-- Daftar lengkap ada di constants/mata_kuliah.json
-- ------------------------------------------------------------
-- MK001 Algoritma & Pemrograman (3 SKS)
-- MK002 Basis Data (3 SKS)
-- MK003 Pemrograman Web (3 SKS)
-- MK004 Jaringan Komputer (3 SKS)
-- MK005 Sistem Operasi (3 SKS)
-- MK006 Rekayasa Perangkat Lunak (3 SKS)
-- MK007 Kecerdasan Buatan (3 SKS)
-- MK008 Keamanan Sistem (2 SKS)
-- MK009 Statistika & Probabilitas (2 SKS)
-- MK010 Matematika Diskrit (2 SKS)
-- MK011 Etika Profesi (2 SKS)
-- MK012 Skripsi / Tugas Akhir (6 SKS)

-- ------------------------------------------------------------
-- SECTION 2: ADMIN
-- Plaintext password: Admin123!
-- ------------------------------------------------------------
INSERT INTO admin (email, password_hash) VALUES
(
    'admin@krs.ac.id',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/IFpGwuS.'
);

-- ------------------------------------------------------------
-- SECTION 3: DOSEN (3 dosen)
-- Plaintext password: Dosen123!
-- ------------------------------------------------------------
-- Simpan UUID dosen ke variabel sementara agar bisa di-referensikan
-- di bagian mahasiswa tanpa hardcode UUID random.

-- Gunakan DO block agar UUID bisa dipakai lintas INSERT
DO $$
DECLARE
    v_dosen1_id UUID;
    v_dosen2_id UUID;
    v_dosen3_id UUID;
BEGIN

    -- Dosen 1: Dr. Budi Santoso
    INSERT INTO dosen (nama, nidn, email, password_hash, no_telp)
    VALUES (
        'Dr. Budi Santoso',
        '0012345678',
        'budi.santoso@krs.ac.id',
        '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        '081234567890'
    )
    RETURNING id INTO v_dosen1_id;

    -- Dosen 2: Dr. Sari Dewi
    INSERT INTO dosen (nama, nidn, email, password_hash, no_telp)
    VALUES (
        'Dr. Sari Dewi',
        '0087654321',
        'sari.dewi@krs.ac.id',
        '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        '082345678901'
    )
    RETURNING id INTO v_dosen2_id;

    -- Dosen 3: Prof. Andi Wijaya
    INSERT INTO dosen (nama, nidn, email, password_hash, no_telp)
    VALUES (
        'Prof. Andi Wijaya',
        '0011223344',
        'andi.wijaya@krs.ac.id',
        '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        '083456789012'
    )
    RETURNING id INTO v_dosen3_id;

    -- ----------------------------------------------------------
    -- SECTION 4: MAHASISWA (10 mahasiswa)
    -- Plaintext password: Mhs123!
    --
    -- Distribusi dosen PA:
    --   Dosen 1 (Budi)  : mahasiswa 1-4  (4 mhs)
    --   Dosen 2 (Sari)  : mahasiswa 5-7  (3 mhs)
    --   Dosen 3 (Andi)  : mahasiswa 8-10 (3 mhs)
    --
    -- Distribusi mata_kuliah (JSONB):
    --   Punya MK  : mhs 2, 3, 4, 6, 7  (5 mhs)
    --   Belum ada : mhs 1, 5, 8, 9, 10 (5 mhs)
    -- ----------------------------------------------------------

    -- MHS 1 — Teknik Informatika, Sem 1, Dosen 1, belum ada MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Andi Prasetyo',
        '2024001',
        'andi.prasetyo@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        1,
        'Teknik Informatika',
        v_dosen1_id,
        '[]'::jsonb
    );

    -- MHS 2 — Teknik Informatika, Sem 3, Dosen 1, punya MK (sem 1 sudah selesai)
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Budi Rahmat',
        '2022001',
        'budi.rahmat@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        3,
        'Teknik Informatika',
        v_dosen1_id,
        '[
            {"kode":"MK001","nama":"Algoritma & Pemrograman","sks":3,"nilai":"A"},
            {"kode":"MK002","nama":"Basis Data","sks":3,"nilai":"AB"},
            {"kode":"MK010","nama":"Matematika Diskrit","sks":2,"nilai":"B"},
            {"kode":"MK003","nama":"Pemrograman Web","sks":3,"nilai":null}
        ]'::jsonb
    );

    -- MHS 3 — Teknik Informatika, Sem 5, Dosen 1, punya MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Citra Lestari',
        '2020001',
        'citra.lestari@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        5,
        'Teknik Informatika',
        v_dosen1_id,
        '[
            {"kode":"MK001","nama":"Algoritma & Pemrograman","sks":3,"nilai":"A"},
            {"kode":"MK002","nama":"Basis Data","sks":3,"nilai":"B"},
            {"kode":"MK003","nama":"Pemrograman Web","sks":3,"nilai":"AB"},
            {"kode":"MK004","nama":"Jaringan Komputer","sks":3,"nilai":"B"},
            {"kode":"MK005","nama":"Sistem Operasi","sks":3,"nilai":null}
        ]'::jsonb
    );

    -- MHS 4 — Sistem Informasi, Sem 7, Dosen 1, punya MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Dewi Anggraini',
        '2018001',
        'dewi.anggraini@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        7,
        'Sistem Informasi',
        v_dosen1_id,
        '[
            {"kode":"MK001","nama":"Algoritma & Pemrograman","sks":3,"nilai":"AB"},
            {"kode":"MK002","nama":"Basis Data","sks":3,"nilai":"A"},
            {"kode":"MK006","nama":"Rekayasa Perangkat Lunak","sks":3,"nilai":"B"},
            {"kode":"MK007","nama":"Kecerdasan Buatan","sks":3,"nilai":"BC"},
            {"kode":"MK012","nama":"Skripsi / Tugas Akhir","sks":6,"nilai":null}
        ]'::jsonb
    );

    -- MHS 5 — Sistem Informasi, Sem 1, Dosen 2, belum ada MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Eko Setiawan',
        '2024002',
        'eko.setiawan@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        1,
        'Sistem Informasi',
        v_dosen2_id,
        '[]'::jsonb
    );

    -- MHS 6 — Sistem Informasi, Sem 3, Dosen 2, punya MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Fitri Handayani',
        '2022002',
        'fitri.handayani@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        3,
        'Sistem Informasi',
        v_dosen2_id,
        '[
            {"kode":"MK001","nama":"Algoritma & Pemrograman","sks":3,"nilai":"B"},
            {"kode":"MK009","nama":"Statistika & Probabilitas","sks":2,"nilai":"AB"},
            {"kode":"MK011","nama":"Etika Profesi","sks":2,"nilai":"A"},
            {"kode":"MK002","nama":"Basis Data","sks":3,"nilai":null}
        ]'::jsonb
    );

    -- MHS 7 — Teknik Informatika, Sem 5, Dosen 2, punya MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Gilang Nugroho',
        '2020002',
        'gilang.nugroho@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        5,
        'Teknik Informatika',
        v_dosen2_id,
        '[
            {"kode":"MK003","nama":"Pemrograman Web","sks":3,"nilai":"A"},
            {"kode":"MK004","nama":"Jaringan Komputer","sks":3,"nilai":"B"},
            {"kode":"MK005","nama":"Sistem Operasi","sks":3,"nilai":"AB"},
            {"kode":"MK008","nama":"Keamanan Sistem","sks":2,"nilai":null}
        ]'::jsonb
    );

    -- MHS 8 — Teknik Informatika, Sem 7, Dosen 3, belum ada MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Hana Kusuma',
        '2018002',
        'hana.kusuma@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        7,
        'Teknik Informatika',
        v_dosen3_id,
        '[]'::jsonb
    );

    -- MHS 9 — Sistem Informasi, Sem 3, Dosen 3, belum ada MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Irwan Fauzi',
        '2022003',
        'irwan.fauzi@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        3,
        'Sistem Informasi',
        v_dosen3_id,
        '[]'::jsonb
    );

    -- MHS 10 — Teknik Informatika, Sem 5, Dosen 3, belum ada MK
    INSERT INTO mahasiswa (nama, nim, email, password_hash, semester, jurusan, dosen_pa_id, mata_kuliah)
    VALUES (
        'Joko Widyatmoko',
        '2020003',
        'joko.widyatmoko@student.krs.ac.id',
        '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        5,
        'Teknik Informatika',
        v_dosen3_id,
        '[]'::jsonb
    );

END $$;

-- ------------------------------------------------------------
-- SECTION 5: VERIFIKASI DATA (opsional, jalankan untuk cek)
-- ------------------------------------------------------------
-- SELECT 'admin'    AS tabel, COUNT(*) FROM admin
-- UNION ALL
-- SELECT 'dosen'    AS tabel, COUNT(*) FROM dosen
-- UNION ALL
-- SELECT 'mahasiswa' AS tabel, COUNT(*) FROM mahasiswa;

-- ============================================================
-- RINGKASAN DATA SEED
-- ============================================================
-- Admin     : 1  (admin@krs.ac.id          / Admin123!)
-- Dosen     : 3
--   - Dr. Budi Santoso   (budi.santoso@krs.ac.id  / Dosen123!)
--   - Dr. Sari Dewi      (sari.dewi@krs.ac.id     / Dosen123!)
--   - Prof. Andi Wijaya  (andi.wijaya@krs.ac.id   / Dosen123!)
-- Mahasiswa : 10 (semua @student.krs.ac.id  / Mhs123!)
--   Dengan mata_kuliah JSONB : 5 mahasiswa (nim: 2022001,2020001,2018001,2022002,2020002)
--   Tanpa mata_kuliah        : 5 mahasiswa
-- ============================================================
