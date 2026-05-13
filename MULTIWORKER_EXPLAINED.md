# Multi-Worker в FastAPI: Полное руководство

## 1. ЧТО ТАКОЕ MULTI-WORKER И ЗАЧЕМ ОНО НУЖНО

### Проблема с одним воркером
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
# ↓ использует только 1 CPU ядро из 8+ доступных
```

Одно приложение FastAPI работает в одном процессе → использует 1 ядро CPU → пропускная способность ограничена одним ядром.

### Решение: Multi-worker
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
# ↓ каждый worker - отдельный процесс с изолированной памятью
# Process 1 ← port 8000
# Process 2 ← port 8000  ← Nginx балансирует нагрузку
# Process 3 ← port 8000
# Process 4 ← port 8000
```

**Выигрыши:**
- Использует все CPU ядра
- Отказоустойчивость: если один воркер упал, остальные работают
- Высокая пропускная способность

**Проблемы:**
- Каждый воркер имеет **ИЗОЛИРОВАННУЮ память**
- Глобальные переменные дублируются в каждом процессе
- Воркеры НЕ видят состояние друг друга

---

## 2. ПРОБЛЕМА В ВАШЕМ КОДЕ: RACE CONDITION С TIMESTAMPS

### Как это работает в вашем проекте

**Архитектура:**
```
┌─────────────────────────────────────────┐
│         Nginx (load balancer)            │
└──┬──────────────────────────────────────┘
   │
   ├── Worker A (pid=100) ──┐
   ├── Worker B (pid=200) ──┤
   ├── Worker C (pid=300) ──┤    ┌─────────────┐
   ├── Worker D (pid=400) ──┼───→│ Redis Broker│
   │                         │    └─────────────┘
   └─────────────────────────┘
```

### ЧТО ПРОИСХОДИТ

1. **Агент подключается к Worker A:**
   ```
   Agent → ingest("/relay/ingest/agent-id") на Worker A
         → Worker A создает AgentState(id)
         → a.updated = time.time()  ← обновляется
         → Видео публикуется в Redis: channel="video:mjpeg:agent-id"
   ```

2. **Worker B получает видео через Redis:**
   ```
   Redis pubsub → Worker B._dispatch()
   
   if a is None:  ← FALSE (агент уже был создан на этом воркере)
       a.updated = time.time()  ← НЕ ВЫПОЛНЯЕТСЯ!
   ```

3. **30+ секунд спустя на Worker B:**
   ```
   GET /relay/agents
   → list_agents()
   → alive = (now - a.updated) < 30.0
   → if elapsed > 30s: agent marked DEAD
   → Dashboard: "Выберите агентов..."
   ```

### ДОКАЗАТЕЛЬСТВО ИЗ ЛОГОВ

```
[relay:list_agents] agent b1a12034-afa0-47f1-9505-a56e4e3dfc7e marked DEAD on worker=ba4e5ff516cb:
  a.updated=1778668593.117, 
  now=1778668652.360, 
  elapsed=59.2s,  ← БОЛЬШЕ 30 СЕКУНД!
  threshold=30.0s,
  a._worker_id=ba4e5ff516cb
```

```
WARNING: [pubsub] ctrl:to:b1a12034-afa0-47f1-9505-a56e4e3dfc7e - no WS found on worker=ba4e5ff516cb
         ↑ Это значит что видео идет от одного воркера, а команды идут на другой
```

---

## 3. КАК ИСПРАВИТЬ: ПРАВИЛЬНАЯ СИНХРОНИЗАЦИЯ

### ❌ ДО (неправильно)
```python
elif channel.startswith("video:mjpeg:"):
    aid = channel[12:]
    a = AGENTS.get(aid)
    if a is None:  # ← проблема! ТОЛЬКО для новых агентов
        a = AgentState(aid)
        a.updated = time.time()  # ← не обновляется для существующих!
        AGENTS[aid] = a
    frame = data if isinstance(data, bytes) else data.encode()
    a.push_mjpeg(frame)
```

### ✅ ПОСЛЕ (исправлено)
```python
elif channel.startswith("video:mjpeg:"):
    aid = channel[12:]
    a = AGENTS.get(aid)
    if a is None:
        a = AgentState(aid)
        AGENTS[aid] = a
    
    # ВАЖНО: ВСЕГДА обновлять timestamp!
    # Это нужно чтобы синхронизировать состояние между воркерами
    a.updated = time.time()  # ← ДОБАВЛЕНО: всегда обновляется
    frame = data if isinstance(data, bytes) else data.encode()
    a.push_mjpeg(frame)
```

---

## 4. ПРАВИЛЬНАЯ АРХИТЕКТУРА MULTI-WORKER

### Принцип 1: Разделенное состояние

**Local state (воркер А видит, но другие НЕ видят):**
- WebSocket соединения (`HUB.agent_ws`, `HUB.agent_worker_ws`)
- Видеобуферы (`a.mjpeg_queue`)
- Локальный кэш (`AGENTS` dict)

**Shared state (все воркеры видят через Redis):**
- Метаданные конфигурации агента (`agent:config:*`)
- Какой воркер "держит" агента (`agent:worker:*`)
- Публичные сообщения (`ctrl:to:*`, `ctrl:from:*`)

### Принцип 2: Heartbeat/Timestamp синхронизация

```python
# Воркер А: видео приходит прямо
ingest(aid):
    a.updated = time.time()  ← обновляется

# Воркер B: видео приходит через Redis
_dispatch():
    a.updated = time.time()  ← ДОЛЖНО обновляться!
```

### Принцип 3: Redis как шина связи

```
┌──────────────┐              ┌─────────────────────┐
│  Worker A    │              │  Worker B           │
│              │              │                     │
│ Agent.uuid   │──pubsub──→   │ (получает видео)    │
│ videos       │   Redis      │ (обновляет status)  │
│ (ingest)     │              │                     │
└──────────────┘              └─────────────────────┘
```

---

## 5. ПОЛНЫЙ ПРИМЕР: КАК ДЕЛАТЬ MULTI-WORKER ПРАВИЛЬНО

### Docker Compose с Nginx

```yaml
version: '3'
services:
  app:
    build: .
    # ВАРИАНТ 1: Uvicorn с многими воркерами
    command: >
      uvicorn app.main:app 
      --host 0.0.0.0 
      --port 8000 
      --workers 4
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
```

### Nginx конфиг (балансировка нагрузки)

```nginx
upstream fastapi {
    # Трафик распределяется между воркерами
    server app:8000;  # Uvicorn слушает на одном порту
                      # но обрабатывает несколько процессов
}

server {
    listen 80;
    
    location / {
        proxy_pass http://fastapi;
        proxy_http_version 1.1;
        proxy_set_header Connection "upgrade";
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Python код для синхронизации

```python
# app/redis_client.py
import aioredis

redis = None

async def get_redis():
    global redis
    if redis is None:
        redis = await aioredis.from_url("redis://localhost:6379")
    return redis

async def close_redis():
    global redis
    if redis:
        await redis.close()
```

```python
# app/main.py
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await relay.PS_MANAGER.start()  # Подписаться на Redis каналы
    yield
    # Shutdown
    await relay.PS_MANAGER.stop()
    await close_redis()

app = FastAPI(lifespan=lifespan)
```

```python
# app/api/relay.py
class PubSubManager:
    """Синхронизирует состояние через Redis pubsub"""
    
    async def start(self):
        r = await get_redis()
        self._pubsub = r.pubsub()
        # Подписаться на все каналы
        await self._pubsub.psubscribe("ctrl:*", "video:*")
        self._task = asyncio.create_task(self._run())
    
    async def _dispatch(self, msg):
        channel = msg["channel"].decode()
        data = msg["data"]
        
        # ВАЖНО: видео может прийти от другого воркера
        # поэтому ОБНОВЛЯЕМ timestamp для синхронизации
        if channel.startswith("video:"):
            aid = channel.split(":")[-1]
            a = AGENTS.get(aid)
            if a is None:
                a = AgentState(aid)
                AGENTS[aid] = a
            a.updated = time.time()  # ← СИНХРОНИЗАЦИЯ
```

---

## 6. ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ

```python
logger.info(f"[relay] ingest START: id={aid}, worker={WORKER_ID}")
logger.info(f"[relay] agent connected: {aid} worker={WORKER_ID}, "
            f"agent_ws_count={len(HUB.agent_ws)}")
logger.warning(f"[relay:list_agents] agent {aid} marked DEAD: "
               f"elapsed={elapsed:.1f}s > 30.0s on worker={WORKER_ID}")
```

Это позволит увидеть:
- На каком воркере видео приходит
- На каком воркере запрашивают статус
- Когда агент становится "мертв"

---

## 7. COMMON MISTAKES И КАК ИХ ИЗБЕЖАТЬ

| Ошибка | Проблема | Решение |
|--------|---------|--------|
| Глобальный счетчик в памяти | Дублируется в каждом воркере | Используйте Redis |
| Кэш в памяти воркера | Воркеры не видят обновления | Синхронизируйте через Redis |
| Timestamp не синхронизируется | Состояние расходится между воркерами | Обновляйте в pubsub |
| WebSocket соединение на воркере А, запрос на воркере B | Команда теряется | Публикуйте в Redis, пусть получит нужный воркер |
| Нет heartbeat механизма | Трудно отследить живые агенты | Используйте timestamp + timeout |

---

## 8. ПРОВЕРКА ИСПРАВЛЕНИЯ

После исправления логи должны показывать:

```
# ДО (НЕПРАВИЛЬНО):
[relay:list_agents] agent b1a12034-afa0... marked DEAD: elapsed=59.2s > 30.0s
↓ пользователь видит пустой dashboard

# ПОСЛЕ (ПРАВИЛЬНО):
[relay:list_agents] agent b1a12034-afa0... ALIVE: elapsed=2.1s
↓ пользователь видит карточку агента
```

---

## 9. ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Как запустить multi-worker в разных окружениях

**1. Локальная разработка (не используйте multi-worker):**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**2. Docker (с multi-worker):**
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**3. systemd (на VPS):**
```ini
[Service]
ExecStart=/usr/local/bin/uvicorn main:app \
    --host 0.0.0.0 --port 8000 --workers 4 \
    --proxy-headers --forwarded-allow-ips=*
```

**4. Gunicorn (альтернатива):**
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

---

## ЗАКЛЮЧЕНИЕ

**Главное правило многопроцессной архитектуры:**

> Если состояние нужно ВСЕМ воркерам → храните в Redis
> Если состояние локально → синхронизируйте через pubsub/events
> Если критично точное состояние → обновляйте timestamp при ЛЮБОМ изменении

В вашем случае: видео поступает → timestamp обновляется → все воркеры видят актуальный статус.
