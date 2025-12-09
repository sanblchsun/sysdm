# check_env.py
import os
from app.config import settings

print("=== Environment variables ===")
print(f"FIRST_SUPERUSER_PASSWORD from .env: {settings.FIRST_SUPERUSER_PASSWORD}")
print(f"Length: {len(settings.FIRST_SUPERUSER_PASSWORD)}")
print(f"Raw bytes: {settings.FIRST_SUPERUSER_PASSWORD.encode()}")

# Проверьте, есть ли скрытые символы
for i, char in enumerate(settings.FIRST_SUPERUSER_PASSWORD):
    print(f"  Character {i}: '{char}' (ASCII: {ord(char)})")