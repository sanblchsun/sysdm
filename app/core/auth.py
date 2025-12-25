from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from authx import AuthX, AuthXConfig
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.database import get_session
from app.models.users import User
from app.config import settings

# Конфигурация AuthX
config = AuthXConfig()
config.JWT_SECRET_KEY = settings.SECRET_KEY
config.JWT_ALGORITHM = "HS256"

security = AuthX(config=config)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)


async def get_current_user(
    request: Request = None,  # type: ignore
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Получить текущего пользователя из токена (поддерживает cookie и header)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Пробуем получить токен из Authorization header
    # 2. Если нет, пробуем из cookie
    if not token and request:
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: Optional[str] = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await session.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Получить активного пользователя"""
    if not bool(current_user.is_active):
        raise HTTPException(status_code=400, detail="Пользователь неактивен")
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Получить администратора"""
    if not bool(current_user.is_admin):
        raise HTTPException(
            status_code=403, detail="Недостаточно прав. Требуются права администратора"
        )
    return current_user


def create_access_token(data: dict):
    """Создать JWT токен"""
    uid = data.get("sub", "")
    expire_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return security.create_access_token(uid=uid, expiry=expire_delta)
