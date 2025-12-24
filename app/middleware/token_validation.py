from fastapi import Request, status
from fastapi.responses import RedirectResponse
import jwt
from app.config import settings
from starlette.middleware.base import BaseHTTPMiddleware


class TokenValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.exclude_paths = [
            "/login",
            "/static",
            "/api/auth",
            "/ping",
            "/",
            "/favicon.ico",
            "/logout",
        ]

    def is_excluded_path(self, path: str) -> bool:
        for excluded in self.exclude_paths:
            if path == excluded or path.startswith(excluded + "/"):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        if self.is_excluded_path(request.url.path):
            return await call_next(request)

        access_token = request.cookies.get("access_token")

        if not access_token:
            # Вместо исключения сразу делаем редирект
            response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
            response.delete_cookie(key="access_token")
            return response

        try:
            jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            # Токен валиден
            return await call_next(request)

        except jwt.ExpiredSignatureError:
            # Токен истек - редирект на логин
            response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
            response.delete_cookie(key="access_token")
            return response

        except jwt.PyJWTError:
            # Любая другая ошибка токена
            response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
            response.delete_cookie(key="access_token")
            return response
