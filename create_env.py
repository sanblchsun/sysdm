# create_env.py
import secrets

print("# ============================================")
print("# SysDM - Environment Configuration Generator")
print("# ============================================")
print("")
print("# Копируйте эти строки в файл .env")
print("")

env_template = f"""# --------- База данных ---------
DATABASE_URL=postgresql://sysdm:sysdm_password@localhost:5432/sysdm_db

# --------- Приложение ----------
APP_TITLE=SysDM
APP_VERSION=1.0.0
DEBUG=True
APP_HOST=0.0.0.0
APP_PORT=8000

# --------- CORS ----------------
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# --------- Безопасность --------
# Сгенерировать: openssl rand -hex 32
SECRET_KEY={secrets.token_urlsafe(32)}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# --------- Агенты --------------
AGENT_HEARTBEAT_INTERVAL=60
AGENT_TIMEOUT=300

# --------- Директории ----------
LOG_DIR=logs
UPLOAD_DIR=uploads
"""

print(env_template)
print("")
print("# Сохраните как .env файл в корне проекта")