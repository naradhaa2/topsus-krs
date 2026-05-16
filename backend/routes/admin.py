import bcrypt
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from models import db, Admin, Dosen, Mahasiswa
from utils.decorators import admin_required
from utils.helpers import success_response, error_response, paginate_query
from utils.cache import get_cache, set_cache, delete_cache, delete_pattern

admin_bp = Blueprint("admin", __name__)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    cached = get_cache("krs:dashboard")
    if cached:
        return success_response(cached)

    total_mahasiswa = Mahasiswa.query.count()
    total_dosen     = Dosen.query.count()

    distribusi_raw = (
        db.session.query(Mahasiswa.jurusan, db.func.count(Mahasiswa.id).label("total"))
        .group_by(Mahasiswa.jurusan)
        .all()
    )
    distribusi = [{"jurusan": r.jurusan, "total": r.total} for r in distribusi_raw]

    # Rata-rata total SKS dihitung di Python dari JSONB
    all_mhs   = Mahasiswa.query.all()
    sks_list  = [sum(mk.get("sks", 0) for mk in (m.mata_kuliah or [])) for m in all_mhs]
    rata_sks  = round(sum(sks_list) / len(sks_list), 2) if sks_list else 0

    data = {
        "total_mahasiswa":  total_mahasiswa,
        "total_dosen":      total_dosen,
        "distribusi_jurusan": distribusi,
        "rata_rata_sks":    rata_sks,
    }
    set_cache("krs:dashboard", data, ttl=600)
    return success_response(data)


# ─── Mahasiswa (Admin CRUD) ───────────────────────────────────────────────────

@admin_bp.route("/mahasiswa", methods=["GET"])
@admin_required
def list_mahasiswa():
    page     = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search   = request.args.get("search", "").strip()

    cache_key = f"krs:admin:mahasiswa:page{page}:per{per_page}:q{search}"
    cached = get_cache(cache_key)
    if cached:
        return success_response(cached)

    query = Mahasiswa.query
    if search:
        query = query.filter(
            db.or_(
                Mahasiswa.nama.ilike(f"%{search}%"),
                Mahasiswa.nim.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(Mahasiswa.created_at.desc())

    paged = paginate_query(query, page, per_page)
    data  = {
        "mahasiswa": [m.to_dict() for m in paged["items"]],
        "total":     paged["total"],
        "pages":     paged["pages"],
        "page":      paged["page"],
        "per_page":  paged["per_page"],
    }
    set_cache(cache_key, data, ttl=300)
    return success_response(data)


@admin_bp.route("/mahasiswa", methods=["POST"])
@admin_required
def create_mahasiswa():
    data = request.get_json(silent=True) or {}

    required = ["nama", "nim", "email", "password", "semester", "jurusan"]
    for field in required:
        if not data.get(field) and data.get(field) != 0:
            return error_response(f"Field '{field}' wajib diisi")

    semester = data.get("semester")
    if not isinstance(semester, int) or not (1 <= semester <= 14):
        return error_response("Semester harus antara 1 sampai 14")

    if Mahasiswa.query.filter_by(nim=data["nim"]).first():
        return error_response("NIM sudah terdaftar")
    if Mahasiswa.query.filter_by(email=data["email"]).first():
        return error_response("Email sudah terdaftar")

    password_hash = bcrypt.hashpw(
        data["password"].encode("utf-8"), bcrypt.gensalt(12)
    ).decode("utf-8")

    mhs = Mahasiswa(
        nama=data["nama"],
        nim=data["nim"],
        email=data["email"].lower(),
        password_hash=password_hash,
        semester=semester,
        jurusan=data["jurusan"],
        dosen_pa_id=data.get("dosen_pa_id"),
        mata_kuliah=[],
    )
    db.session.add(mhs)
    db.session.commit()

    delete_pattern("krs:admin:mahasiswa:")
    delete_cache("krs:dashboard")

    return success_response(mhs.to_dict(), "Mahasiswa berhasil ditambahkan", 201)


@admin_bp.route("/mahasiswa/<uuid:mahasiswa_id>", methods=["PUT"])
@admin_required
def update_mahasiswa(mahasiswa_id):
    mhs  = Mahasiswa.query.filter_by(id=mahasiswa_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    data = request.get_json(silent=True) or {}

    if "nim" in data:
        conflict = Mahasiswa.query.filter_by(nim=data["nim"]).first()
        if conflict and str(conflict.id) != str(mahasiswa_id):
            return error_response("NIM sudah digunakan mahasiswa lain")
        mhs.nim = data["nim"]

    if "email" in data:
        conflict = Mahasiswa.query.filter_by(email=data["email"]).first()
        if conflict and str(conflict.id) != str(mahasiswa_id):
            return error_response("Email sudah digunakan mahasiswa lain")
        mhs.email = data["email"].lower()

    if "semester" in data:
        semester = data["semester"]
        if not isinstance(semester, int) or not (1 <= semester <= 14):
            return error_response("Semester harus antara 1 sampai 14")
        mhs.semester = semester

    for field in ("nama", "jurusan", "dosen_pa_id"):
        if field in data:
            setattr(mhs, field, data[field])

    db.session.commit()
    delete_pattern("krs:admin:mahasiswa:")
    delete_cache("krs:dashboard")

    return success_response(mhs.to_dict(), "Data mahasiswa berhasil diupdate")


@admin_bp.route("/mahasiswa/<uuid:mahasiswa_id>", methods=["DELETE"])
@admin_required
def delete_mahasiswa(mahasiswa_id):
    mhs = Mahasiswa.query.filter_by(id=mahasiswa_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    db.session.delete(mhs)
    db.session.commit()

    delete_pattern("krs:admin:mahasiswa:")
    delete_cache("krs:dashboard")

    return success_response(None, "Mahasiswa berhasil dihapus")


@admin_bp.route("/mahasiswa/<uuid:mahasiswa_id>/dosen-pa", methods=["PUT"])
@admin_required
def assign_dosen_pa(mahasiswa_id):
    mhs = Mahasiswa.query.filter_by(id=mahasiswa_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    data     = request.get_json(silent=True) or {}
    dosen_id = data.get("dosen_id")
    if not dosen_id:
        return error_response("dosen_id wajib diisi")

    dosen = Dosen.query.filter_by(id=dosen_id).first()
    if not dosen:
        return error_response("Dosen tidak ditemukan", 404)

    mhs.dosen_pa_id = dosen_id
    db.session.commit()

    delete_pattern("krs:admin:mahasiswa:")
    delete_cache("krs:dashboard")
    delete_cache(f"krs:dosen:{dosen_id}:bimbingan")

    return success_response(
        mhs.to_dict(include_dosen=True),
        f"Dosen PA berhasil diassign ke {dosen.nama}",
    )


# ─── Dosen (Admin CRUD) ───────────────────────────────────────────────────────

@admin_bp.route("/dosen", methods=["GET"])
@admin_required
def list_dosen():
    page     = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search   = request.args.get("search", "").strip()

    cache_key = f"krs:admin:dosen:page{page}:per{per_page}:q{search}"
    cached = get_cache(cache_key)
    if cached:
        return success_response(cached)

    query = Dosen.query
    if search:
        query = query.filter(
            db.or_(
                Dosen.nama.ilike(f"%{search}%"),
                Dosen.nidn.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(Dosen.created_at.desc())

    paged = paginate_query(query, page, per_page)
    data  = {
        "dosen":    [d.to_dict() for d in paged["items"]],
        "total":    paged["total"],
        "pages":    paged["pages"],
        "page":     paged["page"],
        "per_page": paged["per_page"],
    }
    set_cache(cache_key, data, ttl=300)
    return success_response(data)


@admin_bp.route("/dosen", methods=["POST"])
@admin_required
def create_dosen():
    data = request.get_json(silent=True) or {}

    required = ["nama", "nidn", "email", "password"]
    for field in required:
        if not data.get(field):
            return error_response(f"Field '{field}' wajib diisi")

    if Dosen.query.filter_by(nidn=data["nidn"]).first():
        return error_response("NIDN sudah terdaftar")
    if Dosen.query.filter_by(email=data["email"]).first():
        return error_response("Email sudah terdaftar")

    password_hash = bcrypt.hashpw(
        data["password"].encode("utf-8"), bcrypt.gensalt(12)
    ).decode("utf-8")

    dosen = Dosen(
        nama=data["nama"],
        nidn=data["nidn"],
        email=data["email"].lower(),
        password_hash=password_hash,
        no_telp=data.get("no_telp"),
    )
    db.session.add(dosen)
    db.session.commit()

    delete_pattern("krs:admin:dosen:")
    delete_cache("krs:dashboard")

    return success_response(dosen.to_dict(), "Dosen berhasil ditambahkan", 201)


@admin_bp.route("/dosen/<uuid:dosen_id>", methods=["PUT"])
@admin_required
def update_dosen(dosen_id):
    dosen = Dosen.query.filter_by(id=dosen_id).first()
    if not dosen:
        return error_response("Dosen tidak ditemukan", 404)

    data = request.get_json(silent=True) or {}

    if "nidn" in data:
        conflict = Dosen.query.filter_by(nidn=data["nidn"]).first()
        if conflict and str(conflict.id) != str(dosen_id):
            return error_response("NIDN sudah digunakan dosen lain")
        dosen.nidn = data["nidn"]

    if "email" in data:
        conflict = Dosen.query.filter_by(email=data["email"]).first()
        if conflict and str(conflict.id) != str(dosen_id):
            return error_response("Email sudah digunakan dosen lain")
        dosen.email = data["email"].lower()

    for field in ("nama", "no_telp"):
        if field in data:
            setattr(dosen, field, data[field])

    db.session.commit()
    delete_pattern("krs:admin:dosen:")

    return success_response(dosen.to_dict(), "Data dosen berhasil diupdate")


@admin_bp.route("/dosen/<uuid:dosen_id>", methods=["DELETE"])
@admin_required
def delete_dosen(dosen_id):
    dosen = Dosen.query.filter_by(id=dosen_id).first()
    if not dosen:
        return error_response("Dosen tidak ditemukan", 404)

    db.session.delete(dosen)
    db.session.commit()

    delete_pattern("krs:admin:dosen:")
    delete_cache("krs:dashboard")

    return success_response(None, "Dosen berhasil dihapus")
