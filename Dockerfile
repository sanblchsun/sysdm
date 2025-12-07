# Dockerfile
# ============================================
# SysDM - System Management Docker Image
# ============================================

# Этап 1: Билд
FROM python:3.11-slim AS builder

# Устанавливаем системные зависимости для сборки
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements для кэширования слоев
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Этап 2: Финальный образ
FROM python:3.11-slim

# Метаданные
LABEL maintainer="SysDM Team <admin@sysdm.local>"
LABEL description="SysDM - System Management Platform"
LABEL version="1.0.0"

# Создаем не-root пользователя для безопасности
RUN groupadd -r sysdm && useradd -r -g sysdm -m -d /app sysdm

# Устанавливаем минимальные системные зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем зависимости из builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Копируем исходный код
COPY --chown=sysdm:sysdm . .

# Создаем необходимые директории
RUN mkdir -p /app/logs /app/uploads /app/backups && \
    chown -R sysdm:sysdm /app && \
    chmod +x /app/docker-entrypoint.sh

# Переключаемся на не-root пользователя
USER sysdm

# Настройки Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1

# Переменные окружения (могут быть переопределены)
ENV APP_HOST=0.0.0.0 \
    APP_PORT=8000 \
    DEBUG=False

# Точка входа
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Запуск приложения
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Открываем порт
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
