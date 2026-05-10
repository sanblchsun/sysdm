from datetime import timedelta

from authx import AuthX, AuthXConfig
from app.config import settings


# Конфигурация AuthX
auth_config = AuthXConfig(
    JWT_ALGORITHM="HS256",
    JWT_SECRET_KEY=settings.SECRET_KEY,
    JWT_TOKEN_LOCATION=["headers", "cookies", "json", "query"],
    JWT_HEADER_TYPE="Bearer",
    JWT_ACCESS_COOKIE_NAME="access_token_cookie",
    JWT_REFRESH_COOKIE_NAME="refresh_token_cookie",
    JWT_COOKIE_SECURE=False,
    JWT_COOKIE_CSRF_PROTECT=False,
    JWT_ACCESS_CSRF_COOKIE_NAME="csrf_access_token",
    JWT_REFRESH_CSRF_COOKIE_NAME="csrf_refresh_token",
    JWT_ACCESS_CSRF_HEADER_NAME="X-CSRF-TOKEN-Access",
    JWT_REFRESH_CSRF_HEADER_NAME="X-CSRF-TOKEN-Refresh",
    JWT_JSON_KEY="access_token",
    JWT_REFRESH_JSON_KEY="refresh_token",
    JWT_QUERY_STRING_NAME="token",
    # Sliding session: 30 min inactivity timeout
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),
    JWT_REFRESH_TOKEN_EXPIRES=timedelta(minutes=30),
    JWT_IMPLICIT_REFRESH_DELTATIME=timedelta(minutes=5),
    JWT_IMPLICIT_REFRESH_METHOD_INCLUDE=["GET", "POST", "PUT", "DELETE"],
)


auth = AuthX(config=auth_config)
