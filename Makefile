# Makefile
.PHONY: help build up down logs clean test migrate

# Цвета для вывода
GREEN=\033[0;32m
NC=\033[0m

help:
	@echo "Доступные команды:"
	@echo "  ${GREEN}make build${NC}     - Собрать Docker образ"
	@echo "  ${GREEN}make up${NC}       - Запустить контейнеры"
	@echo "  ${GREEN}make down${NC}     - Остановить контейнеры"
	@echo "  ${GREEN}make logs${NC}     - Показать логи"
	@echo "  ${GREEN}make clean${NC}    - Очистить контейнеры и volumes"
	@echo "  ${GREEN}make test${NC}     - Запустить тесты"
	@echo "  ${GREEN}make migrate${NC}  - Создать и применить миграцию"
	@echo "  ${GREEN}make shell${NC}    - Войти в контейнер приложения"
	@echo "  ${GREEN}make db-shell${NC} - Войти в контейнер базы данных"

build:
	docker-compose build --no-cache

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f app

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec app pytest tests/ -v

migrate:
	docker-compose exec app alembic revision --autogenerate -m "$(message)"
	docker-compose exec app alembic upgrade head

shell:
	docker-compose exec app bash

db-shell:
	docker-compose exec postgres psql -U sysdm -d sysdm_db

backup:
	docker-compose exec postgres pg_dump -U sysdm sysdm_db > backup_$(date +%Y%m%d_%H%M%S).sql

restore:
	@if [ -z "$(file)" ]; then \
		echo "Usage: make restore file=backup.sql"; \
	else \
		docker-compose exec -T postgres psql -U sysdm -d sysdm_db < $(file); \
	fi