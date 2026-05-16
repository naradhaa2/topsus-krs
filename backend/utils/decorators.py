from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def _role_required(role: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"error": "Token tidak valid atau tidak ditemukan"}), 401

            claims = get_jwt()
            if claims.get("role") != role:
                return jsonify({"error": f"Akses '{role}' diperlukan"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


admin_required     = _role_required("admin")
mahasiswa_required = _role_required("mahasiswa")
dosen_required     = _role_required("dosen")
