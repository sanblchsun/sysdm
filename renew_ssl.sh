#!/bin/bash

LOG="/home/bakor_adm/fastapi-https/renew_ssl.log"
DEBUG_LOG="/home/bakor_adm/fastapi-https/renew_debug.log"
COMPOSE="/usr/local/bin/docker-compose"
WORKDIR="/home/bakor_adm/fastapi-https"

echo "[`date`] Starting certificate renewal" >> "$DEBUG_LOG"
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

cd "$WORKDIR"

echo "[INFO] `date`: Starting certbot renew" >> "$LOG"
$COMPOSE run --rm certbot renew >> "$LOG" 2>&1

echo "[INFO] `date`: Reloading nginx" >> "$LOG"
$COMPOSE exec nginx nginx -s reload >> "$LOG" 2>&1

echo "[INFO] `date`: Done" >> "$LOG"
echo "[`date`] Done" >> "$DEBUG_LOG"
