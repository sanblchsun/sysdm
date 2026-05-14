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

## Redis Pub/Sub для команд и статуса (2026-05-14)

### app/api/agent.py — Redis Pub/Sub для команд и статуса

- `_publish_command()`: Публикует команду в Redis канал `agent:{uuid}:commands` (мгновенно, не через polling)
- Команды (stop-rdp-worker, login-user и т.д.): все идут через `_publish_command()`
- `_publish_agent_status()`: Публикует статус агента в `agent:status` канал при heartbeat
- `/api/agent/heartbeat`: Теперь публикует статус даже если БД не обновляется

### app/api/relay.py — WebSocket Pub/Sub для синхронизации статуса

- Новый WebSocket эндпоинт: `@router.websocket("/relay/ws/agent-status-sync")`
- Подписывается на Redis `agent:status` канал
- Форвардит обновления статуса всем подключенным клиентам в реал-времени

### app/templates/partials/top_panel.html — Real-time UI обновления

- `connectAgentStatusSync()`: WebSocket подписка на статус-синхронизацию
- Обновляет онлайн точки в таблице агентов в реал-времени при поступлении статуса
- Автоматически переподключается при разрыве соединения (3s delay)
- Нет необходимости в полинге или перезагрузке страницы

### builder_cpp/agent/cmd/agent/main.cpp — Оптимизированный polling

- Polling `pending-command` эндпоинта изменен: 2 сек → 30 сек (масштабируется на 500+ агентов)
- 500 агентов × 1 запрос на 30 сек = ~17 запросов/сек вместо 250/сек
- Добавлен TODO: Реальная Redis Pub/Sub подписка для мгновенной доставки команд (требует Redis C++ библиотеки)

### Архитектура команд (сейчас):
```
Dashboard/Viewer
    ↓ POST /api/agent/{id}/stop-rdp
Server (Python)
    ├→ Публикует в Redis: agent:{uuid}:commands (мгновенно)
    ├→ Агент получает через HTTP polling (fallback, 30s interval)
    ├→ Агент может получить через WebSocket (если активно)
    └→ Обрабатывает команду (main → worker)

Agent Online Status
    ↓ Heartbeat
Server (Python)
    ├→ Обновляет last_seen в БД
    ├→ Публикует в Redis: agent:status (мгновенно)
    └→ Frontend получает через WebSocket (реал-тайм)
```

### Масштабируемость:

- ✅ Команды: Redis Pub/Sub (O(1) для масштабирования)
- ✅ Статус: Redis Pub/Sub (мгновенные обновления UI)
- ✅ Polling fallback: оптимизирован с 2s на 30s (17 req/sec vs 250 req/sec)
- ✅ WebSocket: push-модель вместо pull-модели
- 🔄 TODO: Redis C++ подписка в агенте для мгновенной доставки команд

## Собранные версии

- agent_universal_1.0.50.exe (2026-05-14): Оптимизированный polling (30s), stop-rdp-worker обработка
