from app.config import settings

print("=== Настройки ===")
print(f"FIRST_SUPERUSER: {settings.FIRST_SUPERUSER}")
print(f"FIRST_SUPERUSER_PASSWORD: {settings.FIRST_SUPERUSER_PASSWORD}")
print(f"DB_HOST: {settings.DB_HOST}")
print(f"DB_NAME: {settings.DB_NAME}")
print(f"DATABASE_URL: {settings.DATABASE_URL}")