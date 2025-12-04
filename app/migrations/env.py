# app/migrations/env.py
import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Добавляем путь к проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Импортируем настройки
from app.config import settings
from app.database import Base
from app.models.agent import Agent  # Импортируем все модели для автогенерации

# Конфигурация Alembic
config = context.config

# Настраиваем логирование
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Устанавливаем URL базы данных из настроек
# Ключевой момент: преобразуем PostgresDsn в строку
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))

# Метаданные для автогенерации
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Запуск миграций в offline режиме."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Запуск миграций в online режиме."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()