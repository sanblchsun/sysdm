# ИСПРАВЛЕНИЯ MULTI-WORKER BUG - CHANGELOG

**Дата:** 13 мая 2026  
**Проблема:** На странице `/rdp/dashboard` циклически появляется сообщение "Выберите агентов в таблице для просмотра (галочка RDP)" даже когда галочка стоит

**Корень проблемы:** Race condition при синхронизации состояния агентов между несколькими воркерами FastAPI

---

## ИЗМЕНЕНИЯ В `app/api/relay.py`

### 1. Функция `PubSubManager._dispatch()` - КРИТИЧНЫЙ ФИКС

**Строки ~100-130 (video:mjpeg и video:h264 каналы)**

**ДО:**
```python
elif channel.startswith("video:mjpeg:"):
    aid = channel[12:]
    a = AGENTS.get(aid)
    if a is None:
        a = AgentState(aid)
        a.updated = time.time()  # ← обновляется ТОЛЬКО для новых агентов
        AGENTS[aid] = a
    frame = data if isinstance(data, bytes) else data.encode()
    a.push_mjpeg(frame)
```

**ПОСЛЕ:**
```python
elif channel.startswith("video:mjpeg:"):
    aid = channel[12:]
    a = AGENTS.get(aid)
    if a is None:
        a = AgentState(aid)
        AGENTS[aid] = a
        logger.debug(f"[pubsub] video:mjpeg:{aid} - created new AgentState on worker={WORKER_ID}")
    
    # !!!!! CRITICAL FIX: MUST update a.updated for ALL video frames
    # not just for newly created agents. This ensures that agents
    # remain "alive" in multi-worker setups where video arrives via Redis.
    a.updated = time.time()  # ← ВСЕГДА обновляется!
    frame = data if isinstance(data, bytes) else data.encode()
    a.push_mjpeg(frame)
    logger.debug(f"[pubsub] video:mjpeg:{aid} - updated timestamp on worker={WORKER_ID}, elapsed since last update: ~0ms")
```

**Объяснение:** Агент считается "живым" если его `updated` было обновлено менее 30 секунд назад. В multi-worker видео может приходить на один воркер, а запрос статуса на другой. Нужно обновлять timestamp ВСЕГДА когда приходит видео, не только для новых агентов.

---

### 2. Функция `list_agents()` - ПОДРОБНОЕ ЛОГИРОВАНИЕ

**Строки ~793-810 (вычисление статуса alive)**

**ДО:**
```python
alive = a.updated > 0 and (now - a.updated) < 30.0
elapsed = now - a.updated if a.updated > 0 else 999.0
ctrl_local = aid in HUB.agent_ws or aid in HUB.agent_worker_ws
```

**ПОСЛЕ:**
```python
alive = a.updated > 0 and (now - a.updated) < 30.0
elapsed = now - a.updated if a.updated > 0 else 999.0

# Log detailed agent status for debugging multi-worker issues
if not alive:
    logger.warning(
        f"[relay:list_agents] agent {aid} marked DEAD on worker={WORKER_ID}: "
        f"a.updated={a.updated}, now={now}, elapsed={elapsed:.1f}s, "
        f"threshold=30.0s, a._worker_id={a._worker_id}"
    )
else:
    logger.debug(
        f"[relay:list_agents] agent {aid} ALIVE on worker={WORKER_ID}: "
        f"elapsed={elapsed:.1f}s"
    )

ctrl_local = aid in HUB.agent_ws or aid in HUB.agent_worker_ws
```

**Объяснение:** Это позволит увидеть в логах точно когда и почему агент становится "мертв", на каком воркере это происходит.

---

### 3. Функция `ingest()` - ТРЕЙСИНГ ВИДЕО

**Строки ~637-705 (получение видео от агента)**

**Добавлено:**
- `worker={WORKER_ID}` в логи start/finish видео потока
- Пример: `[relay] ingest START: id=b1a12034-afa0-47f1-9505-a56e4e3dfc7e, ... worker=ba4e5ff516cb`

**Объяснение:** Позволяет отследить на каком воркере видео приходит от агента.

---

### 4. Функция `ws_control_agent()` - ТРЕЙСИНГ СОЕДИНЕНИЙ

**Строки ~474-552 (WebSocket соединение с агентом)**

**ДО:**
```python
logger.info(f"[relay] agent connected: {aid} role={role} worker={WORKER_ID}")
# ...
logger.info(f"[relay] agent disconnected: {aid} role={role} worker={WORKER_ID}")
```

**ПОСЛЕ:**
```python
logger.info(
    f"[relay] agent connected: {aid} role={role} worker={WORKER_ID}, "
    f"agent_ws_count={len(HUB.agent_ws)}, agent_worker_ws_count={len(HUB.agent_worker_ws)}"
)
# ...
logger.info(
    f"[relay] agent disconnected: {aid} role={role} worker={WORKER_ID}, "
    f"agent_ws_count={len(HUB.agent_ws)}, agent_worker_ws_count={len(HUB.agent_worker_ws)}"
)
```

**Объяснение:** Видно сколько агентов подключено к каждому воркеру и распределение нагрузки.

---

### 5. Функция `send_command_to_agent()` - РАСШИРЕННАЯ ДИАГНОСТИКА

**Строки ~399-449 (отправка команд агенту)**

**ДОБАВЛЕНО:**
- Логирование на каком воркере отправляется команда
- Логирование когда команда идет через Redis на другой воркер
- Предупреждение с информацией о том, какие WS соединения есть локально

**Пример логов:**

```
# Когда WS найдена локально:
[relay] Command sent to main WS agent b1a12034-afa0-47f1-9505-a56e4e3dfc7e, worker=ba4e5ff516cb

# Когда команда идет через Redis на другой воркер:
[relay] Command published to Redis for agent b1a12034-afa0-47f1-9505-a56e4e3dfc7e on worker2-123 (requested from worker=ba4e5ff516cb)

# Когда агент не найден:
[relay] Agent b1a12034-afa0-47f1-9505-a56e4e3dfc7e not connected to any worker.
Current worker=ba4e5ff516cb, agent_ws_count=0, agent_worker_ws_count=0
```

**Объяснение:** Это помогает отследить когда команда теряется или идет на неправильный воркер.

---

## КАК ПРОВЕРИТЬ ИСПРАВЛЕНИЕ

### 1. Посмотреть логи при включении RDP

```bash
docker logs sysdm_api 2>&1 | grep -E "ingest|list_agents|agent connected" | tail -100
```

**Ожидаемый результат:**
- Видео приходит на воркер A: `[relay] ingest START: id=..., worker=ba4e5ff516cb`
- Timestamp обновляется: `[relay:list_agents] agent ... ALIVE: elapsed=2.1s`
- Не должно быть `marked DEAD: elapsed=59.2s`

### 2. Проверить что агент остается "живым"

```bash
# Terminal 1: смотрим логи
docker logs -f sysdm_api 2>&1 | grep "list_agents"

# Terminal 2: обновляем страницу dashboard каждые 5 сек (симулируем запрос)
while true; do curl -s http://dev.local/relay/agents | jq '.agents[] | select(.id=="b1a12034-...") | .alive'; sleep 5; done
```

**ДО:** будет чередоваться true/false каждые 30 сек  
**ПОСЛЕ:** будет всегда true

### 3. Проверить что WebSocket соединения правильно распределены

```bash
docker logs sysdm_api 2>&1 | grep "agent connected" | tail -10
```

Должны видеть разные воркеры для разных агентов.

---

## ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ (ОПЦИОНАЛЬНО)

Если проблемы продолжаются, рассмотрите:

1. **Увеличить timeout с 30 сек на 60 сек:**
   ```python
   alive = a.updated > 0 and (now - a.updated) < 60.0  # было 30.0
   ```

2. **Синхронизировать timestamp через Redis:**
   ```python
   # В ingest():
   await r.hset(f"agent:updated:{aid}", "timestamp", str(time.time()))
   
   # В list_agents():
   redis_updated = await r.hget(f"agent:updated:{aid}", "timestamp")
   if redis_updated:
       a.updated = max(a.updated, float(redis_updated))
   ```

3. **Периодический heartbeat для неактивных агентов:**
   ```python
   # Каждые 10 сек публиковать "ping" в Redis
   await PS_MANAGER.publish(f"heartbeat:{aid}", str(time.time()))
   ```

---

## SUMMARY

| Что | Было | Стало |
|-----|------|-------|
| Обновление timestamp | Только для новых агентов | Для ВСЕХ видеофреймов |
| Логирование статуса | Минимальное | Детальное с worker ID |
| Трейсинг видео | Нет | Есть start/finish |
| Трейсинг WebSocket | Базовое | Расширенное с counts |
| Отладка команд | Сложная | Простая с диагностикой |

**Результат:** Агенты остаются "живыми" в multi-worker режиме, dashboard не мигает, пользователь видит стабильное отображение.
