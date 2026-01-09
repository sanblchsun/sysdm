from typing import AsyncGenerator
from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session  # твоя реальная async-зависимость
from app.core.authx import auth


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def require_user(request: Request):
    try:
        token = await auth.get_access_token_from_request(request)
        payload = auth.verify_token(token, verify_csrf=False)
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )
