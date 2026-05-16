from flask import Blueprint
from flask_jwt_extended import get_jwt_identity

from models import Dosen, Mahasiswa
from utils.decorators import dosen_required
from utils.helpers import success_response, error_response
from utils.cache import get_cache, set_cache

dosen_bp = Blueprint("dosen", __name__)


@dosen_bp.route("/profile", methods=["GET"])
@dosen_required
def get_profile():
    dosen_id = get_jwt_identity()
    dosen = Dosen.query.filter_by(id=dosen_id).first()
    if not dosen:
        return error_response("Dosen tidak ditemukan", 404)
    return success_response(dosen.to_dict())


@dosen_bp.route("/mahasiswa-bimbingan", methods=["GET"])
@dosen_required
def get_mahasiswa_bimbingan():
    dosen_id  = get_jwt_identity()
    cache_key = f"krs:dosen:{dosen_id}:bimbingan"

    cached = get_cache(cache_key)
    if cached:
        return success_response(cached)

    mahasiswa_list = Mahasiswa.query.filter_by(dosen_pa_id=dosen_id).all()

    result = []
    for mhs in mahasiswa_list:
        mk_list = mhs.mata_kuliah or []
        entry   = mhs.to_dict()
        entry["ringkasan_krs"] = {
            "jumlah_mk": len(mk_list),
            "total_sks": sum(mk.get("sks", 0) for mk in mk_list),
        }
        result.append(entry)

    set_cache(cache_key, result, ttl=300)
    return success_response(result)


@dosen_bp.route("/mahasiswa-bimbingan/<uuid:mahasiswa_id>", methods=["GET"])
@dosen_required
def get_detail_mahasiswa(mahasiswa_id):
    dosen_id = get_jwt_identity()

    mhs = Mahasiswa.query.filter_by(id=mahasiswa_id).first()
    if not mhs:
        return error_response("Mahasiswa tidak ditemukan", 404)

    if str(mhs.dosen_pa_id) != dosen_id:
        return error_response("Mahasiswa ini bukan bimbingan Anda", 403)

    mk_list = mhs.mata_kuliah or []
    data    = mhs.to_dict()
    data["krs"] = {
        "mata_kuliah": mk_list,
        "total_sks":   sum(mk.get("sks", 0) for mk in mk_list),
        "jumlah_mk":   len(mk_list),
    }

    return success_response(data)
