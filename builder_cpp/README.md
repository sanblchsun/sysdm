Как использовать:
На Linux — первая установка:

bash builder_cpp/install_crosscompile_tools.shbash builder_cpp/check_crosscompile.sh  # проверка готовностиpython3 builder_cpp/build_agents.py
Или с Docker:

docker build -f Dockerfile.crosscompile -t agent-builder .docker run -v $(pwd):/app agent-builder
На Windows — всё работает как раньше:

python build_agents.py
