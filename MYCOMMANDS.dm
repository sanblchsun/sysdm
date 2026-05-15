// ВАРИАНТ 1: Полная очистка (удаляет все volumes, образы) - новая пустая БД
docker-compose down
docker system prune -a --volumes
docker-compose up -d --build

// ВАРИАНТ 2: Быстрая пересборка (сохраняет БД и данные) - рекомендуется для разработки
docker-compose down
docker-compose build --no-cache
docker-compose up -d


python -m builder_cpp.build_agents
python builder_cpp/build_setup.py 


alembic revision --autogenerate -m "описание"
alembic upgrade head