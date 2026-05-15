# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    # === База данных ===
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""
    DB_HOST: str = ""
    DB_HOST_SCRIPT: str = "localhost"

    # === Приложение ===
    APP_TITLE: str
    APP_VERSION: str
    DEBUG: bool
    APP_HOST: str
    APP_PORT: int

    # === CORS ===
    CORS_ORIGINS: str

    # === Безопасность ===
    SECRET_KEY: str
    # ALGORITHM: ClassVar[str] = "HS256"

    # === Агенты ===
    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_PASSWORD: str
    DISABLE_IP_FILTER: bool = False

    # === Redis ===
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # === Директории ===
    LOG_DIR: str
    UPLOAD_DIR: str

    @property
    def DATABASE_URL(self):
        # Поддержка переменной окружения DATABASE_URL (для Docker)
        if db_url := os.getenv("DATABASE_URL"):
            return db_url
        # Fallback на составленный URL из отдельных переменных
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:5432/{self.DB_NAME}"

    @property
    def DATABASE_URL_SCRIPT(self):
        # URL базы данных для запуска скриптов (использует DB_HOST_SCRIPT для локального запуска async соединения)
        # Используется ТОЛЬКО для создания миграций, не для приложения
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST_SCRIPT}:5432/{self.DB_NAME}"

    
    @property
    def DATABASE_URL_ALEMBIC(self):
        # URL базы данных для запуска alembic миграций (использует DB_HOST_SCRIPT для локального запуска sync соединения)
        # Используется ТОЛЬКО для создания миграций, не для приложения
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST_SCRIPT}:5432/{self.DB_NAME}"

    
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings() # type: ignore
