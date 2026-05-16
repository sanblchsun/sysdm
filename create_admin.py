import asyncio
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Загружаем .env из корня проекта
load_dotenv(Path(__file__).resolve().parent / ".env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)

    def set_password(self, password: str) -> None:
        self.password_hash = pwd_context.hash(password)


async def create_user(database_url: str, username: str, password: str) -> None:
    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        existing_user: Optional[User] = result.scalar_one_or_none()
        if existing_user:
            print(f"❌ Пользователь '{username}' уже существует")
            return

        user = User(username=username, is_active=True)
        user.set_password(password)
        session.add(user)
        await session.commit()
        print(f"✅ Пользователь '{username}' успешно создан")
    await engine.dispose()


if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL_SCRIPT")
    if not db_url:
        user = os.getenv("DB_USER", "postgres")
        pwd = os.getenv("DB_PASSWORD", "")
        name = os.getenv("DB_NAME", "sysdm")
        host = os.getenv("DB_HOST_SCRIPT", "localhost")
        db_url = f"postgresql+asyncpg://{user}:{pwd}@{host}:5432/{name}"

    username = os.getenv("FIRST_SUPERUSER")
    password = os.getenv("FIRST_SUPERUSER_PASSWORD")
    if not username or not password:
        print("❌ Укажите FIRST_SUPERUSER и FIRST_SUPERUSER_PASSWORD")
        exit(1)

    asyncio.run(create_user(db_url, username, password))
