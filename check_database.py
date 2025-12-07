import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Загружаем .env вручную
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Проверка подключения к базе данных...")
print(f"URL: {DATABASE_URL}")

if not DATABASE_URL:
    print("❌ DATABASE_URL не найден в .env файле")
    exit(1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"✅ Подключение успешно!")
        print(f"   PostgreSQL версия: {version}")

        # Проверим таблицы
        result = connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print(f"   Таблицы в базе: {tables}")

except Exception as e:
    print(f"❌ Ошибка подключения: {e}")
    import traceback
    traceback.print_exc()