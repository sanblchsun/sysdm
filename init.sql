-- init.sql
-- Дополнительные настройки PostgreSQL для SysDM

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Настраиваем параметры для производительности
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Создаем пользователя для мониторинга (опционально)
-- CREATE USER monitor WITH PASSWORD 'monitor_password';
-- GRANT pg_monitor TO monitor;

-- Комментарий к базе данных
COMMENT ON DATABASE sysdm_db IS 'SysDM - System Management Database';