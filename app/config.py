# app/config.py
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator
from typing import List
import secrets


class Settings(BaseSettings):
    # === База данных ===
    DATABASE_URL: PostgresDsn

    # === Приложение ===
    APP_TITLE: str
    APP_VERSION: str
    DEBUG: bool = False
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # === CORS ===
    # Используем CORS_ORIGINS (то же имя что в .env)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    # === Безопасность ===
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # === Агенты ===
    AGENT_HEARTBEAT_INTERVAL: int = 60
    AGENT_TIMEOUT: int = 300

    # === Директории ===
    LOG_DIR: str = "logs"
    UPLOAD_DIR: str = "uploads"

    @validator("DEBUG", pre=True)
    def parse_debug(cls, v):
        if isinstance(v, str):
            v_lower = v.lower()
            return v_lower in ("true", "1", "yes", "on", "y", "t")
        return bool(v)

    @property
    def cors_origins_list(self) -> List[str]:
        """Возвращает список origins для CORS middleware"""
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()