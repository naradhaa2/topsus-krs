from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm.attributes import flag_modified

from models import db, Mahasiswa
from utils.decorators import mahasiswa_required
from utils.helpers import success_response, error_response
from utils.cache import delete_cache
from constants import MATA_KULIAH_LIST, VALID_MK_KODE, MK_BY_KODE, MAX_SKS

mahasiswa_bp = Blueprint("mahasiswa", __name__)


@mahasiswa_bp.route("/profile", methods=["GET"])
@mahasiswa_required
def get_profile():
    user_id = get_jwt_identity()
    mhs = Mahasiswa.query.filter_by(id=user_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)
    return success_response(mhs.to_dict(include_dosen=True))


@mahasiswa_bp.route("/krs", methods=["GET"])
@mahasiswa_required
def get_krs():
    user_id = get_jwt_identity()
    mhs = Mahasiswa.query.filter_by(id=user_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    mk_list   = mhs.mata_kuliah or []
    total_sks = sum(mk.get("sks", 0) for mk in mk_list)

    return success_response({
        "mata_kuliah": mk_list,
        "total_sks":   total_sks,
        "jumlah_mk":   len(mk_list),
    })


@mahasiswa_bp.route("/krs", methods=["PUT"])
@mahasiswa_required
def update_krs():
    user_id = get_jwt_identity()
    mhs = Mahasiswa.query.filter_by(id=user_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    data        = request.get_json(silent=True) or {}
    new_mk_list = data.get("mata_kuliah", [])

    if not isinstance(new_mk_list, list):
        return error_response("mata_kuliah harus berupa array")

    # Validate kode
    for mk in new_mk_list:
        kode = mk.get("kode")
        if kode not in VALID_MK_KODE:
            return error_response(f"Kode mata kuliah '{kode}' tidak valid")

    # No duplicates
    kode_list = [mk["kode"] for mk in new_mk_list]
    if len(kode_list) != len(set(kode_list)):
        return error_response("Terdapat mata kuliah duplikat")

    # SKS limit
    total_sks = sum(MK_BY_KODE[mk["kode"]]["sks"] for mk in new_mk_list)
    if total_sks > MAX_SKS:
        return error_response(
            f"Total SKS ({total_sks}) melebihi batas maksimal {MAX_SKS} SKS"
        )

    # Merge: preserve nilai for existing MK
    existing_mk = {mk["kode"]: mk for mk in (mhs.mata_kuliah or [])}
    merged = []
    for mk in new_mk_list:
        master  = MK_BY_KODE[mk["kode"]]
        existed = existing_mk.get(mk["kode"], {})
        merged.append({
            "kode":  master["kode"],
            "nama":  master["nama"],
            "sks":   master["sks"],
            "nilai": existed.get("nilai", None),
        })

    mhs.mata_kuliah = merged
    flag_modified(mhs, "mata_kuliah")  # force SQLAlchemy to detect JSONB change
    db.session.commit()

    if mhs.dosen_pa_id:
        delete_cache(f"krs:dosen:{mhs.dosen_pa_id}:bimbingan")

    return success_response(
        {"mata_kuliah": mhs.mata_kuliah, "total_sks": total_sks},
        "KRS berhasil diupdate",
    )


@mahasiswa_bp.route("/mata-kuliah-tersedia", methods=["GET"])
@mahasiswa_required
def get_mk_tersedia():
    return success_response(MATA_KULIAH_LIST)
