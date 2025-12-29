from typing import AsyncGenerator
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings


engine = create_async_engine(
    url=settings.DATABASE_URL,
    echo=settings.DEBUG,
)

new_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()


async def get_session() -> AsyncGenerator:
    """Зависимость для получения сессии БД"""
    async with new_session() as session:
        yield session
