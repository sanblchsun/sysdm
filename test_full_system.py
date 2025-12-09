# test_full_system.py
import requests
import json
import time

BASE = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"📋 {title}")
    print(f"{'='*60}")

print_section("ПОЛНЫЙ ТЕСТ СИСТЕМЫ SYSDM")

# 1. Проверка здоровья системы
print("1. Проверка здоровья системы...")
resp = requests.get(f"{BASE}/health")
print(f"   ✅ Health: {resp.json()}")

# 2. Аутентификация
print_section("2. АУТЕНТИФИКАЦИЯ")

print("Аутентификация пользователя admin...")
resp = requests.post(
    f"{BASE}/api/v1/auth/login",
    data={"username": "admin", "password": "112233"}
)

if resp.status_code != 200:
    print(f"❌ Ошибка аутентификации: {resp.status_code}")
    print(f"   Ответ: {resp.text}")
    exit(1)

token_data = resp.json()
token = token_data["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print(f"✅ Токен получен: {token[:30]}...")
print(f"   Тип токена: {token_data.get('token_type', 'bearer')}")

# 3. Проверка информации о пользователе
print_section("3. ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ")

resp = requests.get(f"{BASE}/api/v1/auth/me", headers=headers)
if resp.status_code == 200:
    user_info = resp.json()
    print(f"✅ Пользователь: {user_info.get('username')}")
    print(f"   Email: {user_info.get('email')}")
    print(f"   Админ: {user_info.get('is_admin')}")
else:
    print(f"⚠️  Информация о пользователе: {resp.status_code}")
    print(f"   Ответ: {resp.text}")

# 4. Регистрация тестовых агентов (БЕЗ АУТЕНТИФИКАЦИИ!)
print_section("4. РЕГИСТРАЦИЯ АГЕНТОВ")

agents = [
    {
        "agent_id": "web-server-01",
        "hostname": "nginx-web-01",
        "local_ip": "192.168.1.10",
        "operating_system": "Ubuntu 22.04 LTS",
        "platform": "linux",
        "cpu_cores": 4,
        "total_ram": 8192,
        "agent_version": "1.2.0",
        "is_online": True
    },
    {
        "agent_id": "db-server-01",
        "hostname": "postgres-db-01",
        "local_ip": "192.168.1.20",
        "operating_system": "Debian 11",
        "platform": "linux",
        "cpu_cores": 8,
        "total_ram": 16384,
        "agent_version": "1.1.5",
        "is_online": True
    },
    {
        "agent_id": "win-desktop-01",
        "hostname": "win10-workstation",
        "local_ip": "192.168.1.30",
        "operating_system": "Windows 10 Pro",
        "platform": "windows",
        "cpu_cores": 12,
        "total_ram": 32768,
        "agent_version": "1.0.3",
        "is_online": False
    }
]

registered_agents = []
for agent in agents:
    print(f"\nРегистрация агента: {agent['hostname']}...")
    resp = requests.post(
        f"{BASE}/api/v1/agents/register",
        json=agent
    )

    if resp.status_code in [200, 201]:
        agent_info = resp.json()
        registered_agents.append(agent_info)
        print(f"✅ Зарегистрирован: {agent_info.get('agent_id')}")
        print(f"   Сообщение: {agent_info.get('message')}")
        print(f"   Онлайн: {agent_info.get('is_online')}")
    else:
        print(f"❌ Ошибка: {resp.status_code}")
        print(f"   Ответ: {resp.text}")

# 5. Heartbeat для агентов
print_section("5. HEARTBEAT ДЛЯ АГЕНТОВ")

for agent in agents[:2]:  # Отправим heartbeat для первых двух
    agent_id = agent["agent_id"]
    print(f"\nHeartbeat для агента: {agent_id}...")

    resp = requests.post(
        f"{BASE}/api/v1/agents/{agent_id}/heartbeat"
    )

    if resp.status_code == 200:
        agent_data = resp.json()
        print(f"✅ Heartbeat принят")
        print(f"   Последняя активность: {agent_data.get('last_seen')}")
    else:
        print(f"⚠️  Heartbeat ошибка: {resp.status_code}")
        print(f"   Ответ: {resp.text}")

# 6. Получение списка агентов (требует аутентификации)
print_section("6. СПИСОК АГЕНТОВ")

resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
if resp.status_code == 200:
    all_agents = resp.json()
    print(f"✅ Всего агентов: {len(all_agents)}")

    online_count = sum(1 for a in all_agents if a.get('is_online'))
    print(f"   🟢 Онлайн: {online_count}")
    print(f"   🔴 Оффлайн: {len(all_agents) - online_count}")

    print("\n   Детальная информация:")
    for agent in all_agents[:3]:  # Показать первые 3
        status = "🟢" if agent.get('is_online') else "🔴"
        print(f"   {status} {agent.get('agent_id')}:")
        print(f"      Хост: {agent.get('hostname')}")
        print(f"      IP: {agent.get('local_ip')}")
        print(f"      ОС: {agent.get('operating_system')}")
        print(f"      CPU: {agent.get('cpu_cores')} ядер")
        print(f"      RAM: {agent.get('total_ram')} MB")
else:
    print(f"❌ Ошибка получения списка: {resp.status_code}")
    print(f"   Ответ: {resp.text}")

# 7. Получение информации об одном агенте
print_section("7. ИНФОРМАЦИЯ ОБ АГЕНТЕ")

if registered_agents:
    test_agent_id = registered_agents[0]["agent_id"]
    print(f"Получение информации об агенте: {test_agent_id}")

    resp = requests.get(f"{BASE}/api/v1/agents/{test_agent_id}", headers=headers)
    if resp.status_code == 200:
        agent_detail = resp.json()
        print(f"✅ Информация получена:")
        print(f"   ID: {agent_detail.get('id')}")
        print(f"   Хостнейм: {agent_detail.get('hostname')}")
        print(f"   Создан: {agent_detail.get('created_at')}")
        print(f"   Последняя активность: {agent_detail.get('last_seen')}")
    else:
        print(f"⚠️  Ошибка: {resp.status_code}")
        print(f"   Ответ: {resp.text}")

# 8. Тест веб-интерфейса
print_section("8. ВЕБ-ИНТЕРФЕЙС")

web_pages = [
    ("/dashboard", "Дашборд"),
    ("/agents", "Список агентов"),
    ("/login", "Страница входа"),
]

for page, description in web_pages:
    resp = requests.get(f"{BASE}{page}", allow_redirects=False)
    status = "✅" if resp.status_code in [200, 303] else "⚠️"
    redirect = " (редирект)" if resp.status_code == 303 else ""
    print(f"   {status} {description}: {resp.status_code}{redirect}")

# 9. Оффлайн агенты
print_section("9. ОФФЛАЙН АГЕНТЫ")

resp = requests.get(
    f"{BASE}/api/v1/agents/offline/timeout/5",  # Агенты оффлайн более 5 минут
    headers=headers
)

if resp.status_code == 200:
    offline_agents = resp.json()
    print(f"Найдено оффлайн агентов: {len(offline_agents)}")
    for agent in offline_agents[:3]:
        print(f"   🔴 {agent.get('agent_id')}: {agent.get('hostname')}")
else:
    print(f"Ошибка получения оффлайн агентов: {resp.status_code}")

print_section("РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")

print("""
🎯 СИСТЕМА ГОТОВА К РАБОТЕ!

📊 Следующие шаги:
1. Откройте веб-интерфейс: http://localhost:8000/dashboard
2. Проверьте документацию API: http://localhost:8000/docs
3. Настройте агенты для отправки heartbeat
4. Добавьте больше функционала по необходимости

🔧 Для разработки:
- Агенты регистрируются через: POST /api/v1/agents/register
- Heartbeat отправляется через: POST /api/v1/agents/{id}/heartbeat
- Аутентификация: POST /api/v1/auth/login
""")

print(f"\n📞 Текущие эндпоинты:")
print(f"   • Веб-интерфейс: {BASE}/dashboard")
print(f"   • Документация: {BASE}/docs")
print(f"   • API Health: {BASE}/health")
print(f"   • Список агентов: {BASE}/api/v1/agents/")