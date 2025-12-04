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
