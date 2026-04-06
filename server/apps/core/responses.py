from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, status_code=status.HTTP_200_OK):
    body = {"status": "success"}
    if data is not None:
        body["data"] = data
    return Response(body, status=status_code)


def created_response(data=None):
    return success_response(data=data, status_code=status.HTTP_201_CREATED)


def error_response(code: str, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"status": "error", "code": code},
        status=status_code,
    )


def not_found_response(code: str = "common.not_found"):
    return error_response(code=code, status_code=status.HTTP_404_NOT_FOUND)


def validation_error_response(errors: dict):
    return Response(
        {"status": "error", "code": "common.validation_error", "errors": errors},
        status=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


def throttled_response():
    return error_response(
        code="common.rate_limited",
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    )
