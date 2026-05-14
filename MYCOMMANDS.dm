docker-compose down
docker system prune -a --volumes
docker-compose up -d --build

или 

docker-compose down
docker-compose build --no-cache
docker-compose up -d


python -m builder_cpp.build_agents
python builder_cpp/build_setup.py 