from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from datetime import datetime, timedelta
from app.config import settings
from jose import jwt

from app.core.auth import create_access_token


class AutoRenewalMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
        except HTTPException as exc:
            if exc.status_code == 401:
                # Пользователь не авторизован, перенаправляем на страницу входа
                return RedirectResponse("/login", status_code=302)
            raise exc
        return response
