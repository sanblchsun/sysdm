import os
from dotenv import load_dotenv

load_dotenv()

print("Проверка переменных окружения из .env:")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"SECRET_KEY: {os.getenv('SECRET_KEY')[:20]}...")
print(f"FIRST_SUPERUSER: {os.getenv('FIRST_SUPERUSER')}")