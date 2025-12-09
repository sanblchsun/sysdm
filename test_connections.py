# test_connections.py
import os
from app.config import settings
from app.database import engine
from sqlalchemy import text

print("=== Current DATABASE_URL ===")
print(settings.DATABASE_URL)

# Проверьте подключение из приложения
with engine.connect() as conn:
    result = conn.execute(text("SELECT current_database(), current_user, version()"))
    row = result.fetchone()
    print("\n=== Database connection from app ===")
    print(f"Database: {row[0]}")
    print(f"User: {row[1]}")
    print(f"Version: {row[2]}")

    # Проверим наличие пользователя
    result = conn.execute(text("SELECT username FROM users WHERE username = 'admin'"))
    users = result.fetchall()
    print(f"\nUsers 'admin' found: {len(users)}")
    if users:
        print(f"User details: {users}")