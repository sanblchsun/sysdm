# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import settings
import logging
import time

logger = logging.getLogger(__name__)

# Создаем engine БЕЗ подключения
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,  # ✅ Проверка при каждом использовании
    pool_recycle=3600,   # ✅ Пересоздание соединений каждый час
    echo=settings.DEBUG,
)

# Создаем сессии
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_db(max_retries=30, delay=2):
    """
    Ждем подключения к БД при запуске приложения.
    Вызывается вручную из main.py, а не автоматически.
    """
    logger.info("⏳ Waiting for database connection...")

    for attempt in range(max_retries):
        try:
            # Пробуем подключиться
            with engine.connect() as conn:
                conn.execute("SELECT 1")
                logger.info(f"✅ Database connection established (attempt {attempt + 1}/{max_retries})")
                return True

        except OperationalError as e:
            if attempt < max_retries - 1:
                logger.warning(f"⚠️ Database unavailable, retrying in {delay}s... (Error: {e})")
                time.sleep(delay)
            else:
                logger.error(f"❌ Failed to connect to database after {max_retries} attempts")
                return False

    return False


def get_db():
    """
    Dependency для FastAPI.
    Создает новую сессию для каждого запроса.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()