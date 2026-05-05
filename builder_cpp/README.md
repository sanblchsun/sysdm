# Builder для Windows Agent

Сборка Windows-агента из исходного кода `builder_cpp/agent/cmd/agent/main.cpp`.

## Быстрый старт

### Linux с Docker (рекомендуется)

```bash
# Полная сборка с БД (сохраняет информацию о сборке в БД)
docker-compose -f docker-compose.build.yml up

# Результат в ./dist/agents/agent_universal_*.exe
```

### Linux без Docker

```bash
# 1. Установите MinGW-w64 (только первый раз)
bash builder_cpp/install_crosscompile_tools.sh

# 2. Проверьте окружение
bash builder_cpp/check_crosscompile.sh

# 3. Активируйте venv и запустите сборку
source venv/bin/activate
python3 builder_cpp/build_agents.py
```

### Windows

```bash
# Все работает как раньше, требуется MSYS64 с g++
python build_agents.py
```

## Файлы

- `build_agents.py` - основной скрипт сборки (поддерживает Windows и Linux)
- `install_crosscompile_tools.sh` - установка MinGW-w64 и зависимостей
- `check_crosscompile.sh` - проверка готовности окружения
- `CROSSCOMPILE.md` - подробное руководство по кросс-компиляции
- `Dockerfile.crosscompile` - Docker образ для сборки
- `docker-compose.build.yml` - запуск сборки с БД

## Полная документация

Смотрите [CROSSCOMPILE.md](CROSSCOMPILE.md)

