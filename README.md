# Шаг 1: Подготовьте временную конфигурацию Nginx без HTTPS
# Создайте копию вашего основного конфига:
bash
cp ./nginx/default.conf ./nginx/default.conf.backup
# Создайте новый временный конфиг для получения сертификата. В файл ./nginx/default.conf поместите следующее:
nginx
server {
    listen 80;
    server_name srvfree.duckdns.org; # Ваш домен

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Пока что проксируем всё на бэкенд по HTTP
    location / {
        proxy_pass http://app:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
# Важно: Этот конфиг слушает только порт 80 (HTTP) и содержит критически важный блок location /.well-known/acme-challenge/, который позволяет Certbot подтвердить владение доменом.
# Шаг 2: Перезапустите Nginx с временным конфигом
bash
# 1. Остановить и удалить ТОЛЬКО контейнер nginx
docker-compose stop nginx
docker-compose rm -f nginx

# 2. Запустить ТОЛЬКО сервис nginx (он автоматически создаст новый контейнер)
docker-compose up -d nginx
# Шаг 3: Выполните команду получения первого сертификата
Запустите контейнер certbot, чтобы запросить сертификат. Все необходимые папки уже смонтированы в вашем docker-compose.yml.
bash
docker-compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --email ваш_email@example.com -d srvfree.duckdns.org --agree-tos --non-interactive" certbot
# Замените ваш_email@example.com на ваш реальный email!
# Шаг 4: Восстановите основную конфигурацию Nginx
# Верните рабочую конфигурацию с HTTPS на место:
bash
mv ./nginx/default.conf.backup ./nginx/default.conf
# Перезапустите Nginx:
bash
docker-compose up -d --force-recreate nginx
# Шаг 5: Проверьте работу
# Теперь ваш сервис должен быть доступен по https://srvfree.duckdns.org. Сертификаты будут сохранены в ./certbot/conf/live/srvfree.duckdns.org/ на вашем хосте.

# ⚠️ ПРИ ИЗМЕНЕНИИ ПАРОЛЯ супер узера postgres ВЫПОЛНИТЕ:
docker-compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'НОВЫЙ_ПАРОЛЬ';"
docker exec sysdm_postgres env | grep -i postgres
psql postgresql://postgres:password@host:5432/sysdm_db
# SysDM - System Management Platform

Управление компьютерами и серверами через веб-интерфейс.

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/sanblchsun/sysdm.git
cd sysdm

# Создать конфигурацию
cp .env.example .env
# Отредактировать .env при необходимости

# Запустить через Docker
docker-compose up -d

# Открыть в браузере
open http://localhost:8000/docs


# ⚠️ ПРИ ИЗМЕНЕНИИ ПАРОЛЯ К POSTGRES ВЫПОЛНИТЕ:
docker-compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'НОВЫЙ_ПАРОЛЬ';"