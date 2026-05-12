# Выполненные оптимизации

## Быстрые победы (из PERF_REPORT.md)

| # | Изменение | Статус |
|---|---|---|
| 1 | `asyncio.Queue` вместо `Event` для MJPEG | ✅ Сделано (было в коде) |
| 2 | `del buf[:n]` вместо `buf = buf[n:]` в `_parse_mjpeg_frames` | ✅ Сделано (2026-05-12) |
| 3 | Thread pool для парсинга MJPEG (`run_in_executor`) | ✅ Сделано (было в коде) |
| 4 | Инкрементальный H.264 парсер в `rdp_view.html` | ✅ Сделано (2026-05-12) |
| 5 | `TCP_NODELAY` на WebSocket сокетах | ✅ Сделано (было в коде) |
| 6 | Очистка умерших агентов из `AGENTS` | ✅ Сделано (2026-05-12) |

## Исправленные баги

- `redis_client.py` — race condition в `get_redis()`: добавлен `asyncio.Lock`
- `relay.py` — утечка памяти в `list_agents()`: `load_from_redis()` теперь загружает `updated` из Redis

## Multi-worker (2026-05-12)

### relay.py
- `AgentState.persist_runtime()` — синхронизация `codec_current`, `updated` и runtime-полей в Redis
- `load_from_redis()` — загрузка `updated`, `codec_current`, `encoder_current`, `bitrate_current`, `fps_current` из Redis
- `ingest()` — heartbeat в Redis каждые 15 сек + `persist_runtime()` при старте
- `list_agents()` — alive-детекция через `updated` из Redis (окно 30 сек)

### nginx/default.conf
- Upstream `sysdm_cluster` с `hash $uri consistent` (закомментирован multi-server вариант)
- Все `proxy_pass` направлены через upstream

### docker-compose.prod.yml
- Добавлен комментарий о масштабировании: `docker compose up --scale app=4`
