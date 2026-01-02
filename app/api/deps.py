from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session  # твоя реальная async-зависимость

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session

