# app/middleware/token_validation.py
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from app.config import settings
from jose import jwt, ExpiredSignatureError, JWTError
from loguru import logger


class TokenValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Сначала получаем токен из cookie
        token = request.cookies.get("access_token")
        logger.info(f"Это Middlewar {token}")
        if token:
            logger.info("Это if token")
            try:
                # Проверяем токен на валидность
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                exp_timestamp = payload.get("exp")
                now = datetime.utcnow()

                # Если токен просрочен, перенаправляем на страницу входа
                if exp_timestamp and datetime.fromtimestamp(exp_timestamp) < now:
                    logger.info("Это /login")
                    return RedirectResponse("/login", status_code=302)

            except (ExpiredSignatureError, JWTError):
                # Ошибка при расшифровке или неправильный токен
                logger.info("Это next /login")
                return RedirectResponse("/login", status_code=302)

        # Если токен не найден или всё прошло успешно, продолжаем дальше
        logger.info("Это next /login")
        return await call_next(request)
