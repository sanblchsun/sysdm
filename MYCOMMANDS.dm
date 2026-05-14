docker-compose down
docker system prune -a --volumes
docker-compose up -d --build

или 

docker-compose down
docker-compose build --no-cache
docker-compose up -d
