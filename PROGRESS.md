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

## Multi-worker: п. 3.2.4 (2026-05-12)

### relay.py — ControlHub через Redis Pub/Sub

- Добавлен `PubSubManager` — подписка на `ctrl:*` и `video:*` при старте каждого worker
- `ws_control_agent`: публикует `hello`/`clipboard` в `ctrl:from:{aid}`, сохраняет hello в Redis
- `ws_control_viewer`: публикует mouse/keyboard в `ctrl:to:{aid}`, получает hello из Redis если нет локально
- `send_command_to_agent`: сначала локальный agent_ws, затем Redis Pub/Sub `ctrl:to:{aid}` как fallback
- `_dispatch()`: получает Pub/Sub сообщения и направляет в локальные WebSocket'ы
- `REDIS_WORKER_KEY` — отслеживание на каком worker'е находится WebSocket агента
- `list_agents`: `ctrl_connected` теперь проверяет Redis (кросс-воркер)

### agent.py — Pending Commands в Redis Lists

- `_pending_commands`/`_pending_results` → Redis Lists `pending_cmd:{uuid}` / `pending_result:{uuid}`
- TTL 5 минут на каждую команду
- Функции: `_push_pending_command`, `_pop_pending_command`, `_push_command_result`

### main.py — Жизненный цикл PubSubManager

- `startup`: `PS_MANAGER.start()` — запуск фонового listener Pub/Sub
- `shutdown`: `PS_MANAGER.stop()` — остановка listener

### nginx/default.conf

- `map $uri $route_key` — извлечение ID агента из URI для consistent hash
- upstream `sysdm_cluster` использует `hash $route_key consistent`
- `resolver 127.0.0.11` для Docker DNS (поддержка нескольких контейнеров)
- Закомментированный multi-server вариант заменён на `hash $route_key` с одним сервером `app:8000 resolve`

### Dockerfile.prod

- `uvicorn --workers 4` — 4 процесса внутри одного контейнера

### docker-compose.prod.yml

- Добавлен сервис `redis:7-alpine` (отсутствовал в prod-конфиге)
- `depends_on: redis` для app
- Обновлён комментарий о масштабировании
