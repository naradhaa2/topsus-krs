from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)

    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
    )

    from routes.auth      import auth_bp
    from routes.admin     import admin_bp
    from routes.mahasiswa import mahasiswa_bp
    from routes.dosen     import dosen_bp

    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(admin_bp,     url_prefix="/api/admin")
    app.register_blueprint(mahasiswa_bp, url_prefix="/api/mahasiswa")
    app.register_blueprint(dosen_bp,     url_prefix="/api/dosen")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource tidak ditemukan"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method tidak diizinkan"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
