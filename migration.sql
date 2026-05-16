-- ============================================================
-- KRS SYSTEM — DATABASE MIGRATION
-- Platform  : Supabase (PostgreSQL 15+)
-- Jalankan  : paste ke Supabase SQL Editor, lalu klik RUN
-- ============================================================

-- ------------------------------------------------------------
-- SECTION 1: EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ------------------------------------------------------------
-- SECTION 2: ENUM TYPES
-- ------------------------------------------------------------
CREATE TYPE role_enum AS ENUM ('admin', 'mahasiswa', 'dosen');

-- ------------------------------------------------------------
-- SECTION 3: TABEL ADMIN
-- Hanya untuk keperluan autentikasi admin sistem.
-- ------------------------------------------------------------
CREATE TABLE admin (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin IS 'Akun administrator sistem KRS';

-- ------------------------------------------------------------
-- SECTION 4: TABEL DOSEN
-- ------------------------------------------------------------
CREATE TABLE dosen (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nama          VARCHAR(255) NOT NULL,
    nidn          VARCHAR(20)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    no_telp       VARCHAR(20),
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  dosen        IS 'Data dosen / pembimbing akademik';
COMMENT ON COLUMN dosen.nidn   IS 'Nomor Induk Dosen Nasional (unik per dosen)';
COMMENT ON COLUMN dosen.no_telp IS 'Nomor telepon opsional';

-- ------------------------------------------------------------
-- SECTION 5: TABEL MAHASISWA
-- mata_kuliah disimpan sebagai JSONB dengan format:
-- [{"kode":"MK001","nama":"Algoritma & Pemrograman","sks":3,"nilai":null}]
-- nilai bisa: null (belum ada), "A","AB","B","BC","C","D","E"
-- ------------------------------------------------------------
CREATE TABLE mahasiswa (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nama          VARCHAR(255) NOT NULL,
    nim           VARCHAR(20)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    semester      INTEGER      NOT NULL CHECK (semester BETWEEN 1 AND 14),
    jurusan       VARCHAR(100) NOT NULL,
    dosen_pa_id   UUID         REFERENCES dosen(id) ON DELETE SET NULL,
    mata_kuliah   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  mahasiswa             IS 'Data mahasiswa beserta KRS (JSONB)';
COMMENT ON COLUMN mahasiswa.nim         IS 'Nomor Induk Mahasiswa (unik)';
COMMENT ON COLUMN mahasiswa.dosen_pa_id IS 'FK ke dosen pembimbing akademik; NULL jika belum assign';
COMMENT ON COLUMN mahasiswa.mata_kuliah IS 'Array JSON mata kuliah yang diambil pada semester aktif';

-- ------------------------------------------------------------
-- SECTION 6: TRIGGER — AUTO UPDATE updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dosen_updated_at
    BEFORE UPDATE ON dosen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_mahasiswa_updated_at
    BEFORE UPDATE ON mahasiswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- SECTION 7: INDEX UNTUK PERFORMA QUERY
-- ------------------------------------------------------------
CREATE INDEX idx_mahasiswa_dosen_pa ON mahasiswa(dosen_pa_id);
CREATE INDEX idx_mahasiswa_nim      ON mahasiswa(nim);
CREATE INDEX idx_dosen_nidn         ON dosen(nidn);

-- Index tambahan untuk pencarian teks pada JSONB mata_kuliah
CREATE INDEX idx_mahasiswa_mk_gin   ON mahasiswa USING GIN (mata_kuliah);

-- ------------------------------------------------------------
-- SELESAI — migration.sql
-- Jalankan seed.sql setelah ini berhasil tanpa error.
-- ------------------------------------------------------------
