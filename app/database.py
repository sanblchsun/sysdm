import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from loguru import logger
from environs import Env

env = Env()
env.read_env()

logger.info("===== LOADED ENVIRONMENT VARIABLES app/database.py =====")
logger.info(f"DATABASE_URL={env.str('DATABASE_URL')}")
logger.info(f"DB_HOST={env.str('DB_HOST')}")
logger.info(f"DB_PORT={env.str('DB_PORT')}")



DATABASE_URL = env.str("DATABASE_URL", "postgresql://postgres:postgres@db:5432/fastapi_db")

engine = None
while engine is None:
    try:
        engine = create_engine(DATABASE_URL, echo=True, future=True)
        # Пробуем соединиться с базой
        with engine.connect() as conn:
            print("✅ Connected to Postgres!")
    except OperationalError as e:
        print(f"❌ Postgres is unavailable, retrying in 2 seconds... Error: {e}")
        time.sleep(2)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
