from flask import jsonify


def success_response(data, message: str = "Success", code: int = 200):
    return jsonify({"data": data, "message": message}), code


def error_response(message: str, code: int = 400):
    return jsonify({"error": message}), code


def paginate_query(query, page: int, per_page: int) -> dict:
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items":    pagination.items,
        "total":    pagination.total,
        "pages":    pagination.pages,
        "page":     page,
        "per_page": per_page,
    }
