from flask import jsonify


def error_response(message: str, status: int, *, code: str, detail: str | None = None):
    body = {"error": message, "code": code}
    if detail:
        body["detail"] = detail
    return jsonify(body), status
