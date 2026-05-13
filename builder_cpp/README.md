# Builder для Windows Agent

Сборка Windows-агента из исходного кода `builder_cpp/agent/cmd/agent/main.cpp`.

### Linux без Docker

```bash
# 1. Установите MinGW-w64 (только первый раз)
bash builder_cpp/install_crosscompile_tools.sh

# 2. Проверьте окружение
bash builder_cpp/check_crosscompile.sh

# 3. Активируйте venv и запустите сборку
source venv/bin/activate
python3 -m builder_cpp.build_agents
```


