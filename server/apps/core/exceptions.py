from rest_framework.views import exception_handler
from rest_framework import status


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    code_map = {
        status.HTTP_400_BAD_REQUEST: "common.bad_request",
        status.HTTP_401_UNAUTHORIZED: "common.unauthorized",
        status.HTTP_403_FORBIDDEN: "common.forbidden",
        status.HTTP_404_NOT_FOUND: "common.not_found",
        status.HTTP_405_METHOD_NOT_ALLOWED: "common.method_not_allowed",
        status.HTTP_429_TOO_MANY_REQUESTS: "common.rate_limited",
        status.HTTP_500_INTERNAL_SERVER_ERROR: "common.server_error",
    }

    error_code = code_map.get(response.status_code, "common.unknown_error")

    if isinstance(response.data, dict) and "detail" in response.data:
        response.data = {"status": "error", "code": error_code}
    elif isinstance(response.data, dict):
        response.data = {
            "status": "error",
            "code": "common.validation_error",
            "errors": response.data,
        }
    else:
        response.data = {"status": "error", "code": error_code}

    return response
