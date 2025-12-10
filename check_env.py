# check_env.py
import os
from app.config import settings

print("=== Environment variables ===")
print(f"RDB_USER: {settings.DB_USER}")
print(f"DB_PASSWORD: {settings.DB_PASSWORD}")
print(f"RDB_NAME: {settings.DB_NAME}")
print(f"DB_HOST: {settings.DB_HOST}")
print(f"DATABASE_URL: {settings.DATABASE_URL}")

# Проверьте, есть ли скрытые символы
for i, char in enumerate(settings.FIRST_SUPERUSER_PASSWORD):
    print(f"  Character {i}: '{char}' (ASCII: {ord(char)})")