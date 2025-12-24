from fastapi import Request, HTTPException, status
import jwt
from app.config import settings
from starlette.middleware.base import BaseHTTPMiddleware


class TokenValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Пути, которые НЕ требуют проверки токена
        self.exclude_paths = [
            "/login",
            "/static",
            "/api/auth",
            "/ping",
            "/",
            "/favicon.ico",
            "/logout",  # Добавляем logout, так как он удаляет токен
        ]

    def is_excluded_path(self, path: str) -> bool:
        """Проверяет, нужно ли пропустить проверку токена для этого пути."""
        for excluded in self.exclude_paths:
            if path == excluded or path.startswith(excluded + "/"):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        # Пропускаем проверку для исключенных путей
        if self.is_excluded_path(request.url.path):
            return await call_next(request)

        # Получаем токен из куки
        access_token = request.cookies.get("access_token")

        if not access_token:
            # Нет токена = пользователь не авторизован
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Требуется аутентификация",
            )

        try:
            # Проверяем валидность JWT токена
            jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            # Токен валиден - пропускаем запрос дальше

        except jwt.ExpiredSignatureError:
            # Токен просрочен
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Срок действия токена истек",
            )
        except jwt.PyJWTError:
            # Любая другая ошибка токена
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверные учетные данные",
            )

        # Токен валиден, продолжаем обработку запроса
        return await call_next(request)
