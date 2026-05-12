# SysDM — Анализ производительности удаленного рабочего стола

## 1. Архитектура проекта

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (reverse proxy)                 │
│          Static files · WebSocket · Video ingest             │
└──────────┬──────────────────────────────────────┬───────────┘
           │ HTTP/WS                               │ HTTPS
┌──────────▼──────────────────────────────────────▼───────────┐
│               FastAPI App (uvicorn, 1 процесс)                │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ agent.py   │  │  relay.py    │  │   pages.py           │ │
│  │ /api/agent │  │  ingest      │  │   UI routes          │ │
│  │ register   │  │  stream/mjpeg│  │   /rdp/viewer        │ │
│  │ telemetry  │  │  ws/h264     │  │   /rdp/dashboard     │ │
│  │ heartbeat  │  │  ws/control  │  │   agent tree/table   │ │
│  │ commands   │  │  config      │  │   modals             │ │
│  └──────┬─────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │               │                      │             │
│  ┌──────▼───────────────▼──────────────────────▼───────────┐ │
│  │              Core · Middleware · Auth                    │ │
│  │    authx.py (JWT) · auth_agent.py · AuthHTMLMiddleware   │ │
│  └──────────────────────────┬───────────────────────────────┘ │
│                             │                                  │
│  ┌──────────────────────────▼───────────────────────────────┐ │
│  │              SQLAlchemy Async + PostgreSQL                │ │
│  │    Models: Company · Department · Agent · User · Build    │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**Поток видеоданных при RDP-сессии:**

```
┌─────────┐   HTTP POST /ingest (MJPEG или H.264)    ┌──────────┐
│  Windows │  ─────────────────────────────────────→  │          │
│  Agent   │                                          │  FastAPI │
│  (C++)   │  ←──── WS /ws/control/agent ──────────  │  (relay) │
└─────────┘                                           │          │
                                                      │  ┌────┐  │
                                                      │  │buf │  │
                                                      │  └────┘  │
                                                      └────┬─────┘
                                                           │
                                              ┌────────────┼────────────┐
                                              │            │            │
                                    ┌─────────▼──┐  ┌──────▼──────┐
                                    │ /stream/    │  │ /ws/stream/ │
                                    │ mjpeg/{aid}  │  │ h264/{aid}  │
                                    │ (HTTP SSE)  │  │ (WebSocket) │
                                    └─────────┬───┘  └──────┬──────┘
                                              │            │
                                    ┌─────────▼────────────▼────────┐
                                    │      Browser (WebCodecs)     │
                                    │  MJPEG: <img> src streaming  │
                                    │  H.264: WebCodecs VideoDecoder│
                                    └───────────────────────────────┘
```

---

## 2. Выявленные проблемы производительности

### 2.1. Видео проходит через Python/FastAPI — главное узкое место

Всё видео — и MJPEG, и H.264 — проходит через **один asyncio-процесс FastAPI**. Python не оптимизирован для high-throughput real-time видео. Критичные участки:

- Парсинг MJPEG (поиск SOI/EOI маркеров, `del buf[:n]`)
- Поиск H.264 start code / IDR offset (`find_idr_offset` — линейный поиск по всему буферу)
- Всё это выполняется **в event loop'е**, блокируя обработку других запросов, WebSocket'ов и агентов

**Где** (`app/api/relay.py`):
- Строки 384–440: MJPEG парсинг в `ingest()`
- Строки 122–141: `find_idr_offset()` — O(n) поиск
- Строки 86–104: `push_h264()` — линейный проход по всем подписчикам

### 2.2. MJPEG: двойная буферизация и потеря кадров

```python
# app/api/relay.py:70-76
def push_mjpeg(self, frame: bytes):
    self.mjpeg_latest = frame        # ← только последний кадр
    self.mjpeg_count += 1
    ev = self._mjpeg_event
    self._mjpeg_event = asyncio.Event()  # ← замена события
    ev.set()
```

Проблемы:
- **Потеря кадров**: если 2+ кадра пришли между итерациями генератора, промежуточные теряются (только latest)
- **Livelock-риск**: замена `_mjpeg_event` на новый экземпляр может привести к race condition, когда генератор ждет старый event, который уже никто не вызовет
- **O(n) операция на кадр**: `del buf[:eoi+2]` — сдвиг всего содержимого bytearray при каждом кадре

В генераторе (`stream_mjpeg`, стр. 452–469):
```python
async def gen():
    last = -1
    if a.mjpeg_latest is None:
        await a.wait_mjpeg(timeout=10.0)  # ← 10 секунд ожидания!
    while True:
        if a.mjpeg_count != last and a.mjpeg_latest is not None:
            last = a.mjpeg_count
            yield ...  # ← отдаем кадр
        else:
            await a.wait_mjpeg(timeout=5.0)  # ← 5 секунд ожидания!
```

### 2.3. H.264: избыточное копирование на клиенте

```javascript
// app/static/rdp_view.html:376-381
const merged = new Uint8Array(buf.length + add.length);
merged.set(buf, 0);
merged.set(add, buf.length);
buf = merged;
drainAUs();
```

- **Новая аллокация + полная копия** буфера при каждом WS-сообщении (до 30–60 раз/сек)
- **drainAUs()** вызывает `findStartCodes()` — O(n) по всему буферу каждый раз
- `buf.slice(starts[...])` (стр. 419) — еще одна копия

### 2.4. Управление (мышь/клавиатура) — высокая задержка

```
Mouse click → Browser JS → WS → FastAPI → WS → Windows Agent → ... → обработка → 
→ скриншот → HTTP POST /ingest → FastAPI → буфер → WS/HTTP → Browser
```

Каждое движение/клик проходит **6-hop путь** через Python-сервер. Это TCP (WebSocket), который подвержен:
- Head-of-line blocking
- TCP backpressure при загруженном канале
- Отсутствие приоритизации управления перед видеопотоком

### 2.5. Нет адаптивного битрейта

Конфигурация (`fps`, `bitrate`, `codec`, `encoder`) устанавливается **статически** (стр. 47-52 relay.py). Нет механизма:
- Мониторинга RTT / jitter / packet loss
- Автоматического снижения FPS при плохом канале
- Переключения между H.264 ↔ MJPEG в зависимости от условий

### 2.6. Один процесс — нет изоляции

FastAPI запущен как **один uvicorn worker**. API, БД, WebSocket, видеопотоки — всё в одном процессе.

При 10+ одновременных RDP-сессиях:
- Парсинг MJPEG блокирует event loop → задержки управления у всех
- Утечка памяти в AGENTS dict (никогда не очищается)
- Отсутствует backpressure при перегрузке

---

## 3. Предлагаемые изменения

### 3.1. Быстрые победы (дни)

| # | Изменение | Файл | Описание | Эффект |
|---|---|---|---|---|
| 1 | Заменить `_mjpeg_event` на `asyncio.Queue(maxsize=2)` | `relay.py:59-83` | Очередь с last-value семантикой, без race condition | Устранение livelock, предсказуемое поведение |
| 2 | Использовать `memoryview` вместо `bytearray` для парсинга | `relay.py:398-425` | Отказ от `del buf[:n]`, переход на offset + slicing | Уменьшение O(n²) копирований |
| 3 | Вынести парсинг MJPEG в thread pool | `relay.py:389-434` | `loop.run_in_executor(None, parse_frames, data)` | Не блокирует event loop |
| 4 | Оптимизировать клиентский H.264 парсер | `rdp_view.html:372-420` | Инкрементальный парсинг: хранить offset вместо слияния буфера | Уменьшение аллокаций в 60x |
| 5 | TCP_NODELAY на WebSocket сокеты | `relay.py:220,263` | Отключить Nagle для control WS | Снижение latency управления |
| 6 | Очистка умерших агентов из AGENTS | `relay.py:116` | Периодическая очистка по `updated + timeout` | Предотвращение утечки памяти |
| 7 | Убрать дублирование compat_router | `relay.py:561-735` | Заменить дублирование на middleware-редирект | Сокращение кода в 2x |

### 3.2. Среднесрочные архитектурные изменения (недели)

#### 3.2.1. Внедрить WebRTC (LiveKit / mediasoup)

```diff
- Agent → HTTP POST (MJPEG/H.264) → FastAPI → HTTP/WS → Browser
+ Agent → WebRTC (H.264/SVC) → SFU (LiveKit) → WebRTC → Browser
```

Преимущества:
- **UDP транспорт** — без TCP head-of-line blocking
- **Adaptive bitrate** — Google Congestion Control / REMB автоматически подстраивают битрейт
- **Sub-100ms latency** — против текущих 200–500ms
- **P2P опция** — возможность прямого соединения viewer↔agent

#### 3.2.2. Выделить media relay в отдельный процесс

```diff
- [FastAPI: API + WS + Video]
+ [FastAPI: API + WS control] → [Media Relay (Go/Rust): ingest + stream]
```

Использовать внутреннюю очередь (NATS / Redis Streams / gRPC bi-directional stream) для передачи видео между API и relay-сервисом.

**Почему Go/Rust**: нулевые аллокации при парсинге H.264 NAL units, истинная параллельность, лучше работа с сетевым I/O.

#### 3.2.3. Адаптивный битрейт

Добавить модуль `app/core/bandwidth_estimator.py`:

```python
class BandwidthEstimator:
    # Мониторинг RTT через timestamp в заголовках ingest
    # Анализ задержек доставки кадров
    # Автоматическая корректировка:
    #   - bitrate (4M ↔ 1M ↔ 512K)
    #   - fps (30 ↔ 15 ↔ 5)
    #   - resolution (1920x1080 ↔ 1280x720 ↔ 800x600)
    #   - codec (h264 ↔ mjpeg)
```

#### 3.2.4. Multi-worker с внешним хранилищем состояний

```diff
- AGENTS: Dict[str, AgentState]  # в памяти одного процесса
+ AGENTS: Redis  # общее хранилище для всех worker'ов
```

- `AgentState` → Redis Hash с TTL
- `ControlHub` → Redis Pub/Sub (agent публикует, viewer'ы подписываются)
- H.264 keyframe buffer → Redis Streams или файловое хранилище

Позволяет запускать `uvicorn --workers 4` без потери состояния.

#### 3.2.5. SFU для нескольких вьюеров

Сейчас каждый viewer H.264 получает отдельную копию стрима через `h264_subscribers`. С SFU (Selective Forwarding Unit) стрим приходит на сервер один раз и форвардится всем viewer'ам без дублирования на стороне агента.

### 3.3. Долгосрочные изменения (месяцы)

| Изменение | Описание |
|---|---|
| **Полный переход на H.264/H.265** | MJPEG потребляет в 5–10x больше bandwidth при том же качестве |
| **Добавить AV1** | 30–40% лучше сжатия чем H.264 при том же битрейте |
| **P2P архитектура** | Сервер только для signal/TURN, видео и управление напрямую |
| **GPU encoding на агенте** | NVENC/AMF/QSV для H.264/H.265 без нагрузки на CPU |
| **WebAssembly парсер на клиенте** | Вынести парсинг H.264 NAL в WASM для предсказуемой производительности |

---

## 4. Roadmap внедрения

```
┌───────────────────────────────────────────────────────────────┐
│  Неделя 1: Быстрые победы                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Queue вместо Event  │ memoryview │ ThreadPool │ TCP_NODELAY│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Неделя 2-3: Архитектурные изменения                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Media relay (Go/Rust)  │  Adaptive bitrate  │  Redis   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Неделя 4-8: WebRTC миграция                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LiveKit/medasoup  │  SFU  │  UDP control  │  P2P       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Месяц 3+: Долгосрочные                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AV1/H.265  │  GPU encoding  │  WASM parser  │  P2P full │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 5. Ожидаемый эффект

| Метрика | Сейчас | После быстрых правок | После WebRTC |
|---|---|---|---|
| Latency управления | 150–500ms | 100–300ms | 30–100ms |
| FPS (MJPEG, 4M) | 8–15 | 10–20 | — |
| FPS (H.264, 4M) | 15–30 | 20–30 | 30–60 |
| Использование CPU (сервер) | 1 core 80% | 1 core 40% | 1 core 10% |
| Макс. параллельных сессий | 5–10 | 10–20 | 50+ |
| Bandwidth на сессию | 3–8 Mbps | 2–6 Mbps | 1–4 Mbps |
