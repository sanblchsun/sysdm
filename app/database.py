#>основной импорт для подключения к базе
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# <сновной импорт для подключения к базе

from sqlalchemy.exc import OperationalError
import time
from loguru import logger
from environs import Env

env = Env()
env.read_env()

DATABASE_URL = env.str("DATABASE_URL")

# будем в цикле, пока не подключимся к базе
engine = None
while engine is None:
    try:
        engine = create_engine(DATABASE_URL)
        # Пробуем соединиться с базой
        with engine.connect() as conn:
            logger.info("✅ Connected to Postgres!")
    except OperationalError as e:
        logger.error(f"❌ Postgres is unavailable, retrying in 2 seconds... Error: {e}")
        time.sleep(2)
    except Exception as e:
        logger.error(f"❌ Postgres is unavailable, retrying in 2 seconds... Error1: {e}")
        time.sleep(2)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
