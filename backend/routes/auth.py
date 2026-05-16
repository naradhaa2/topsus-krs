import bcrypt
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, verify_jwt_in_request

from models import Admin, Dosen, Mahasiswa
from utils.helpers import success_response, error_response

auth_bp = Blueprint("auth", __name__)

_ROLE_MODEL = {
    "admin":     Admin,
    "dosen":     Dosen,
    "mahasiswa": Mahasiswa,
}


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role     = (data.get("role") or "").strip().lower()

    if not email or not password or not role:
        return error_response("email, password, dan role wajib diisi")

    if role not in _ROLE_MODEL:
        return error_response("role harus salah satu dari: admin, dosen, mahasiswa")

    Model = _ROLE_MODEL[role]
    user  = Model.query.filter_by(email=email).first()

    if not user:
        return error_response("Email atau password salah", 401)

    try:
        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8"),
        )
    except Exception:
        return error_response("Email atau password salah", 401)

    if not password_valid:
        return error_response("Email atau password salah", 401)

    nama = getattr(user, "nama", "Admin")
    additional_claims = {"role": role, "nama": nama}

    token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
    )

    return success_response(
        {
            "access_token": token,
            "user": {**user.to_dict(), "role": role},
        },
        "Login berhasil",
    )


@auth_bp.route("/me", methods=["GET"])
def get_me():
    try:
        verify_jwt_in_request()
    except Exception:
        return error_response("Token tidak valid atau tidak ditemukan", 401)

    claims  = get_jwt()
    user_id = get_jwt_identity()
    role    = claims.get("role")

    Model = _ROLE_MODEL.get(role)
    if Model is None:
        return error_response("Role tidak valid", 400)

    user = Model.query.filter_by(id=user_id).first()
    if not user:
        return error_response("User tidak ditemukan", 404)

    return success_response({**user.to_dict(), "role": role})
