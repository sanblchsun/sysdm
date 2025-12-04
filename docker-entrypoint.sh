#!/bin/bash
# docker-entrypoint.sh
# ============================================
# Entrypoint для контейнера SysDM
# ============================================

set -e

echo "========================================"
echo "🚀 Запуск SysDM v1.0.0"
echo "========================================"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден!"
    echo "   Создайте файл .env или используйте переменные окружения"
    echo "   Минимальная конфигурация:"
    echo "   DATABASE_URL=postgresql://user:pass@host:port/db"
    echo "   SECRET_KEY=$(openssl rand -hex 32)"
    exit 1
fi

# Проверяем подключение к базе данных
if [ -z "$DATABASE_URL" ] && [ -f .env ]; then
    # Парсим DATABASE_URL из .env
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL не установлен!"
    exit 1
fi

# Извлекаем параметры подключения из DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -e 's|^.*@||' -e 's|:.*$||')
DB_PORT=$(echo $DATABASE_URL | sed -e 's|^.*:||' -e 's|/.*$||' | grep -o '[0-9]*$')

echo "🔧 Конфигурация:"
echo "   Host: ${APP_HOST:-0.0.0.0}:${APP_PORT:-8000}"
echo "   Debug: ${DEBUG:-False}"
echo "   DB Host: $DB_HOST"
echo "   DB Port: $DB_PORT"

# Ожидаем готовности базы данных
echo "⏳ Ожидание готовности PostgreSQL..."
until PGPASSWORD=$(echo $DATABASE_URL | grep -oP '(?<=:)[^:@]+(?=@)') \
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$(echo $DATABASE_URL | grep -oP '^[^:]+://\K[^:]+')" \
      -d "$(echo $DATABASE_URL | grep -oP '[^/]+$')" \
      -c '\q' 2>/dev/null; do
    echo "   PostgreSQL недоступен, повторная попытка через 5 секунд..."
    sleep 5
done
echo "✅ PostgreSQL доступен"

# Выполняем миграции
echo "🔄 Применение миграций базы данных..."
alembic upgrade head

# Создаем директории, если их нет
mkdir -p logs uploads backups

# Проверяем права на директории
chmod 755 logs uploads backups

echo "========================================"
echo "🚀 Запуск приложения..."
echo "========================================"

# Запускаем приложение
exec "$@"