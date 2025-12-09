
from pydantic_settings import BaseSettings  # Измененный импорт! для postgres2
from typing import List
import secrets


class Settings(BaseSettings):
    # === База данных ===
    DATABASE_URL: str

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
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # === Агенты ===
    AGENT_HEARTBEAT_INTERVAL: int
    AGENT_TIMEOUT: int

    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_PASSWORD: str

    # === Директории ===
    LOG_DIR: str
    UPLOAD_DIR: str

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
