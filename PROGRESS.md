# Выполненные оптимизации

## Быстрые победы (из PERF_REPORT.md)

| # | Изменение | Статус |
|---|---|---|
| 1 | `asyncio.Queue` вместо `Event` для MJPEG | ✅ Сделано (было в коде) |
| 2 | `del buf[:n]` вместо `buf = buf[n:]` в `_parse_mjpeg_frames` | ✅ Сделано (2026-05-12) |
| 3 | Thread pool для парсинга MJPEG (`run_in_executor`) | ✅ Сделано (было в коде) |
| 4 | Оптимизация клиентского H.264 парсера (`rdp_view.html`) | ❌ |
| 5 | `TCP_NODELAY` на WebSocket сокетах | ✅ Сделано (было в коде) |
| 6 | Очистка умерших агентов из `AGENTS` | ✅ Сделано (2026-05-12) |
| 7 | Убрать дублирование compat_router | ❌ (неактуально) |

## Исправленные баги

- `redis_client.py` — race condition в `get_redis()`: добавлен `asyncio.Lock`
- `relay.py` — утечка памяти в `list_agents()`: `load_from_redis()` теперь выставляет `updated = time.time()`
