# ⚠️ ПРИ ИЗМЕНЕНИИ ПАРОЛЯ супер узера postgres ВЫПОЛНИТЕ:
# ⚠️ docker-compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'НОВЫЙ_ПАРОЛЬ';"
docker exec sysdm_postgres env | grep -i postgres
psql postgresql://postgres:password@host:5432/sysdm_db
# SysDM - System Management Platform

Управление компьютерами и серверами через веб-интерфейс.

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/sanblchsun/sysdm.git
cd sysdm

# Создать конфигурацию
cp .env.example .env
# Отредактировать .env при необходимости

# Запустить через Docker
docker-compose up -d

# Открыть в браузере
open http://localhost:8000/docs
