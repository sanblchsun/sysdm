from pydantic_settings import BaseSettings  # Измененный импорт!
from typing import List
import secrets


class Settings(BaseSettings):
    # === База данных ===
    DATABASE_URL: str

    # === Приложение ===
    APP_TITLE: str = "SysDM"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # === CORS ===
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    # === Безопасность ===
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # === Агенты ===
    AGENT_HEARTBEAT_INTERVAL: int = 60
    AGENT_TIMEOUT: int = 300

    FIRST_SUPERUSER: str = "admin"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    # === Директории ===
    LOG_DIR: str = "logs"
    UPLOAD_DIR: str = "uploads"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()