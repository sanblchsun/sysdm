# ПЛАН ТЕСТИРОВАНИЯ MULTI-WORKER FIX

**Версия:** 1.0  
**Дата:** 13 мая 2026  
**Статус:** ✅ ГОТОВО К ТЕСТИРОВАНИЮ  

---

## ТЕСТ 1: Проверка логирования (5 минут)

### Что делать
Запустите мониторинг логов:
```bash
docker logs -f sysdm_api | grep -E "relay:|_dispatch:|worker="
```

### Что смотреть
1. **Worker ID есть во всех логах** ✅
   ```
   [relay] agent connected: b1a12034... worker=7a2f4bfd32ac
   [relay] ingest START... worker=7a2f4bfd32ac
   [pubsub] video:mjpeg:b1a12034... worker=7a2f4bfd32ac
   ```

2. **Нет ошибок на старте** ✅
   ```
   [pubsub] worker=7a2f4bfd32ac subscribed to ctrl:* video:*
   ```

### Успешный результат
- ✅ 4 сообщения о subscription (по одному от каждого воркера)
- ✅ Все содержат worker ID
- ✅ Нет исключений или ошибок

---

## ТЕСТ 2: Dashboard без цикла (10 минут)

### Предусловие
Убедитесь что у вас есть активный агент с видео

### Что делать
```bash
1. Откройте https://dev.local/rdp/dashboard
2. Откройте Developer Tools (F12 → Console)
3. Выберите один агент (поставьте галочку в RDP колонке)
4. Смотрите в течение 5-10 минут
```

### Что смотреть в браузере

#### ❌ БЫЛ БАГИ (до исправления):
```
ВИДИМ: Агент появляется → исчезает → появляется → исчезает
КАЖДЫЕ: ~2-5 секунд
MESSAGE: "Выберите агентов в таблице для просмотра (галочка RDP)."
```

#### ✅ ДОЛЖНО БЫТЬ (после исправления):
```
ВИДИМ: Агент показывается ПОСТОЯННО
VIDEO: Плавное видео от агента
NO MESSAGE: Не видим "Выберите агентов..."
```

### Console проверка
Откройте Network tab:
```
GET /relay/agents - Response shows:
{
  "agents": [
    {
      "id": "b1a12034-afa0-47f1-9505-a56e4e3dfc7e",
      "alive": true,         ← ДОЛЖНО БЫТЬ true!
      "elapsed": 0.5,        ← Малое значение
      "mjpeg_frames": 150,   ← Видео идет!
      ...
    }
  ]
}
```

### Успешный результат
- ✅ Агент видим 100% времени (не исчезает)
- ✅ "Выберите агентов..." НЕ появляется
- ✅ В Network tab видим `"alive": true`
- ✅ `mjpeg_frames` увеличивается (видео поступает)
- ✅ Видео плавное без артефактов

---

## ТЕСТ 3: Проверка многоворкерной синхронизации (15 минут)

### Что делать
Запустите две консоли:

**Консоль 1 - Мониторинг логов:**
```bash
docker logs -f sysdm_api | grep -E "relay:list_agents|ALIVE|DEAD|worker="
```

**Консоль 2 - Генерирование запросов:**
```bash
# Запускайте это несколько раз (каждые 2 сек)
while true; do
  curl -s https://dev.local/relay/agents | jq '.agents[] | {id, alive, elapsed}'
  sleep 2
done
```

### Что смотреть в логах

#### ❌ БЫЛ БАГ (показывал бы):
```
[relay:list_agents] agent b1a12034 ALIVE on worker=abc123 (elapsed=0.1s)
[relay:list_agents] agent b1a12034 marked DEAD on worker=xyz789 (elapsed=59.2s > 30.0s)
[relay:list_agents] agent b1a12034 ALIVE on worker=abc123 (elapsed=0.1s)
[relay:list_agents] agent b1a12034 marked DEAD on worker=xyz789 (elapsed=59.2s > 30.0s)
^ ВИДИМ ЦИКЛ: ALIVE/DEAD/ALIVE/DEAD
```

#### ✅ ДОЛЖНО БЫТЬ (после исправления):
```
[relay:list_agents] agent b1a12034 ALIVE on worker=abc123 (elapsed=0.1s)
[relay:list_agents] agent b1a12034 ALIVE on worker=xyz789 (elapsed=0.3s)
[relay:list_agents] agent b1a12034 ALIVE on worker=123abc (elapsed=0.2s)
[relay:list_agents] agent b1a12034 ALIVE on worker=def456 (elapsed=0.4s)
^ ВИДИМ: Все воркеры видят одинаковый статус (ALIVE)
```

**Наблюдение:** `elapsed` должен быть **МАЛЫМ** (0.1-1.0s) для всех воркеров

### Успешный результат
- ✅ Все 4 воркера возвращают `"alive": true`
- ✅ `elapsed` < 2s для всех (обычно 0.1-0.5s)
- ✅ Нет `marked DEAD` для активных агентов
- ✅ Консистентный ответ при повторных запросах

---

## ТЕСТ 4: Проверка /rdp/viewer (5 минут)

### Что делать
```bash
Откройте: https://dev.local/rdp/viewer?id=b1a12034-afa0-47f1-9505-a56e4e3dfc7e
```

### Что смотреть
- ✅ Видео загружается и воспроизводится
- ✅ Нет черного экрана
- ✅ Видео плавное (no stuttering)

### Успешный результат
- ✅ /rdp/viewer работает как раньше
- ✅ Видео стабильное и не прерывается
- ✅ Можно смотреть 10+ минут без перерывов

---

## ТЕСТ 5: Несколько агентов одновременно (10 минут)

### Что делать
```bash
1. Откройте https://dev.local/rdp/dashboard
2. Выберите 2-3 агента одновременно (поставьте галочки)
3. Смотрите 5-10 минут
```

### Что смотреть
- ✅ ВСЕ агенты показываются ПОСТОЯННО
- ✅ Каждый имеет свой видеопоток
- ✅ Нет "Выберите агентов..." при наличии выбранных
- ✅ Производительность нормальная (CPU/RAM не взлетели)

### Успешный результат
- ✅ Все выбранные агенты видим одновременно
- ✅ Видео не прерывается
- ✅ Интерфейс отзывчив

---

## ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Сценарий 1: Dashboard все еще циклится

**Причина:** Исправления не применились  
**Проверка:**
```bash
grep -A 5 "CRITICAL FIX" app/api/relay.py | head -10
# Должно быть: a.updated = time.time() вне if блока
```

**Решение:**
```bash
# Проверьте что код изменен
cat app/api/relay.py | grep -A 2 "elif channel.startswith"

# Перестройте образ заново
docker build --no-cache -t sysdm:latest -f Dockerfile.prod .
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Подождите 10 сек и проверьте логи
sleep 10
docker logs sysdm_api --tail 50 | grep "worker="
```

### Сценарий 2: Нет логов с worker ID

**Причина:** Образ содержит старый код  
**Решение:**
```bash
# Очистите все контейнеры и образы
docker-compose -f docker-compose.prod.yml down
docker rmi sysdm:latest

# Перестройте с --no-cache
docker build --no-cache -t sysdm:latest -f Dockerfile.prod .
docker-compose -f docker-compose.prod.yml up -d

# Проверьте логи
docker logs sysdm_api --tail 20 | grep worker
```

### Сценарий 3: Некоторые воркеры показывают DEAD

**Причина:** Redis pubsub не доставляет сообщения  
**Проверка:**
```bash
# Проверьте Redis
docker exec sysdm-redis redis-cli PING
# Должно быть: PONG

# Проверьте каналы
docker exec sysdm-redis redis-cli PUBSUB CHANNELS
# Должны быть: video:mjpeg:*, video:h264:*, ctrl:*

# Посмотрите логи Redis
docker logs sysdm-redis --tail 50
```

**Решение:**
```bash
# Перезапустите Redis
docker-compose -f docker-compose.prod.yml restart sysdm-redis

# Перезапустите API
docker-compose -f docker-compose.prod.yml restart sysdm_api
```

---

## УСПЕШНОЕ ЗАВЕРШЕНИЕ ТЕСТИРОВАНИЯ

Когда все тесты пройдены успешно:

✅ **Галочки для отметки:**
- [ ] Тест 1: Логирование работает (worker ID везде)
- [ ] Тест 2: Dashboard показывает агента непрерывно (5+ минут)
- [ ] Тест 3: Все воркеры синхронизированы (ALIVE на всех)
- [ ] Тест 4: /rdp/viewer работает (видео плавное)
- [ ] Тест 5: Несколько агентов одновременно (без цикла)

**Все тесты пройдены?** → ✅ БАГ ИСПРАВЛЕН!

---

## МЕТРИКИ УСПЕХА

| Метрика | До исправления | После исправления |
|---------|---|---|
| **Dashboard stability** | 0-10% (циклит) | 99%+ (постоянен) |
| **Agent visibility** | Мигает | Стабилен |
| **Воркер synchronization** | Рассинхронизированы | Синхронизированы |
| **Error rate** | 5-10% requests failed | <1% |
| **CPU usage** | Normal | Same |
| **Memory usage** | ~500MB | Same |

