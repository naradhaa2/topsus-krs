import uuid
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSONB

db = SQLAlchemy()


class Admin(db.Model):
    __tablename__ = "admin"

    id            = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id":         str(self.id),
            "email":      self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Dosen(db.Model):
    __tablename__ = "dosen"

    id            = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama          = db.Column(db.String(255), nullable=False)
    nidn          = db.Column(db.String(20), unique=True, nullable=False)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    no_telp       = db.Column(db.String(20))
    created_at    = db.Column(db.DateTime, server_default=db.func.now())
    updated_at    = db.Column(db.DateTime, server_default=db.func.now())

    mahasiswa_bimbingan = db.relationship(
        "Mahasiswa",
        back_populates="dosen_pa",
        foreign_keys="[Mahasiswa.dosen_pa_id]",
    )

    def to_dict(self):
        return {
            "id":         str(self.id),
            "nama":       self.nama,
            "nidn":       self.nidn,
            "email":      self.email,
            "no_telp":    self.no_telp,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Mahasiswa(db.Model):
    __tablename__ = "mahasiswa"

    id            = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama          = db.Column(db.String(255), nullable=False)
    nim           = db.Column(db.String(20), unique=True, nullable=False)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    semester      = db.Column(db.Integer, nullable=False)
    jurusan       = db.Column(db.String(100), nullable=False)
    dosen_pa_id   = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("dosen.id", ondelete="SET NULL"),
        nullable=True,
    )
    # JSONB: always reassign (don't mutate in-place) so SQLAlchemy detects changes
    mata_kuliah   = db.Column(JSONB, nullable=False, server_default="[]", default=list)
    created_at    = db.Column(db.DateTime, server_default=db.func.now())
    updated_at    = db.Column(db.DateTime, server_default=db.func.now())

    dosen_pa = db.relationship(
        "Dosen",
        back_populates="mahasiswa_bimbingan",
        foreign_keys="[Mahasiswa.dosen_pa_id]",
    )

    def to_dict(self, include_dosen=False):
        data = {
            "id":           str(self.id),
            "nama":         self.nama,
            "nim":          self.nim,
            "email":        self.email,
            "semester":     self.semester,
            "jurusan":      self.jurusan,
            "dosen_pa_id":  str(self.dosen_pa_id) if self.dosen_pa_id else None,
            "mata_kuliah":  self.mata_kuliah or [],
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_dosen and self.dosen_pa:
            data["dosen_pa"] = {
                "nama":    self.dosen_pa.nama,
                "nidn":    self.dosen_pa.nidn,
                "email":   self.dosen_pa.email,
                "no_telp": self.dosen_pa.no_telp,
            }
        return data
