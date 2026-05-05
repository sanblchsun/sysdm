# Cross-Compilation Guide: Linux-to-Windows

Этот руководство описывает как компилировать Windows-агент из Linux-окружения.

## Требования

### На Linux (Debian/Ubuntu)

Установите MinGW-w64 toolchain:

```bash
# Используя готовый скрипт:
bash builder_cpp/setup_linux_crosscompile.sh

# Или вручную:
sudo apt-get update
sudo apt-get install -y mingw-w64 mingw-w64-x86-64
```

### На Windows

Используйте существующий скрипт (требуется MSYS64 с установленным g++):

```bash
python build_agents.py
```

## Использование

### Способ 1: Компиляция на Linux (встроенный MinGW-w64)

Установите MinGW-w64 локально:

```bash
# Активируйте виртуальное окружение
source venv/bin/activate

# Установите MinGW-w64
bash builder_cpp/install_crosscompile_tools.sh

# Проверьте окружение
bash builder_cpp/check_crosscompile.sh

# Запустите скрипт сборки
python builder_cpp/build_agents.py
```

### Способ 2: Docker (рекомендуется)

Docker способ удобнее, так как не требует установки зависимостей на хосте:

```bash
# Сборка и запуск с автоматическим созданием БД
docker-compose -f docker-compose.build.yml up

# Результат будет в ./dist/agents/
```

Альтернативно, если вам нужно только собрать бинарник без сохранения в БД:

```bash
docker build -f Dockerfile.crosscompile -t agent-builder .
docker run -v $(pwd)/dist:/app/dist agent-builder
```

Скрипт автоматически определит вашу ОС и выберет подходящий компилятор:
- **Windows**: `C:/msys64/ucrt64/bin/g++.exe` (MSYS64)
- **Linux**: `x86_64-w64-mingw32-g++` (MinGW-w64)
- **macOS**: `x86_64-w64-mingw32-g++` (MinGW-w64)

## Как это работает

1. **Автоматическое определение ОС**: Скрипт определяет текущую платформу
2. **Выбор компилятора**: Использует правильный кросс-компилятор
3. **Правильная обработка аргументов**: 
   - На Windows: команда запускается через shell
   - На Linux: команда запускается напрямую
4. **Вывод информации**: Скрипт показывает какой компилятор используется

## Вывод при сборке

```
[i] Using compiler: x86_64-w64-mingw32-g++
[i] Platform: Linux
[i] Using MinGW-w64 cross-compilation settings
[+] Running: x86_64-w64-mingw32-g++ -o ...
[+] Universal agent built: agent_universal_1.0.1.exe
```

## Проверка установки

```bash
# Проверьте, что компилятор доступен:
which x86_64-w64-mingw32-g++

# Или запросите версию:
x86_64-w64-mingw32-g++ --version
```

## Разрешение проблем

### "x86_64-w64-mingw32-g++: command not found"

Убедитесь, что MinGW-w64 установлен:
```bash
sudo apt-get install -y mingw-w64 mingw-w64-x86-64
```

### Ошибки при линковке библиотек Windows

Убедитесь, что используются статические флаги `-static`, что уже сделано в скрипте.
