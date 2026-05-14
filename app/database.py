# app/database.py
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    # Connection pooling configuration for better performance
    pool_size=20,                          # Base pool size
    max_overflow=10,                       # Additional connections above pool_size
    pool_pre_ping=True,                    # Verify connections before using
    pool_recycle=3600,                     # Recycle connections every hour
    connect_args={
        "timeout": 10,                     # Connection timeout
        "command_timeout": 30,             # Query timeout
        "server_settings": {
            "jit": "off",                  # Disable JIT for consistency
            "statement_timeout": "30000",  # 30 second query timeout
        }
    }
)


AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


async def get_db() -> AsyncGenerator:
    async with AsyncSessionLocal() as session:
        yield session
