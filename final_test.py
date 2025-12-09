# final_test.py
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("🏁 ФИНАЛЬНЫЙ ТЕСТ SYSDM")
print("=" * 60)

# 1. Проверка публичных эндпоинтов
print("\n📡 1. Проверка публичных эндпоинтов:")
public_endpoints = [
    ("/health", "GET"),
    ("/", "GET"),
    ("/docs", "GET"),
    ("/openapi.json", "GET"),
    ("/login", "GET"),
]

for endpoint, method in public_endpoints:
    try:
        if method == "GET":
            resp = requests.get(f"{BASE}{endpoint}")
        status = "✅" if resp.status_code < 400 else "⚠️"
        print(f"   {status} {method} {endpoint}: {resp.status_code}")
    except Exception as e:
        print(f"   ❌ {method} {endpoint}: {e}")

# 2. Аутентификация
print("\n🔐 2. Аутентификация...")
try:
    resp = requests.post(
        f"{BASE}/api/v1/auth/login",
        data={"username": "admin", "password": "112233"}
    )

    if resp.status_code == 200:
        token_data = resp.json()
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   ✅ Успешная аутентификация")
        print(f"   🔑 Токен: {token[:30]}...")
        print(f"   🕒 Тип токена: {token_data.get('token_type', 'bearer')}")
    else:
        print(f"   ❌ Ошибка аутентификации: {resp.status_code}")
        print(f"   📄 Ответ: {resp.text}")
        exit(1)

except Exception as e:
    print(f"   ❌ Исключение: {e}")
    exit(1)

# 3. Тест защищенных эндпоинтов
print("\n🛡️ 3. Тест защищенных эндпоинтов (с токеном):")
protected_endpoints = [
    ("/api/v1/auth/me", "GET"),
    ("/dashboard", "GET"),
    ("/agents", "GET"),
]

for endpoint, method in protected_endpoints:
    try:
        if method == "GET":
            resp = requests.get(f"{BASE}{endpoint}", headers=headers)

        if resp.status_code == 200:
            print(f"   ✅ {method} {endpoint}: {resp.status_code}")
            if endpoint == "/api/v1/auth/me":
                user_data = resp.json()
                print(f"      👤 Пользователь: {user_data.get('username')}")
                print(f"      📧 Email: {user_data.get('email')}")
                print(f"      👑 Админ: {user_data.get('is_admin')}")
        elif resp.status_code in [401, 403]:
            print(f"   🔒 {method} {endpoint}: {resp.status_code} (требуется другая аутентификация)")
        else:
            print(f"   ⚠️ {method} {endpoint}: {resp.status_code}")

    except Exception as e:
        print(f"   ❌ {method} {endpoint}: {e}")

# 4. Регистрация агентов
print("\n🤖 4. Регистрация тестовых агентов:")

agents = [
    {
        "agent_id": "server-01",
        "hostname": "web-server-01",
        "local_ip": "192.168.1.10",
        "operating_system": "Ubuntu 22.04",
        "platform": "linux",
        "cpu_cores": 4,
        "total_ram": 8192,
        "is_online": True
    },
    {
        "agent_id": "server-02",
        "hostname": "db-server-01",
        "local_ip": "192.168.1.20",
        "operating_system": "CentOS 7",
        "platform": "linux",
        "cpu_cores": 8,
        "total_ram": 16384,
        "is_online": True
    },
    {
        "agent_id": "workstation-01",
        "hostname": "win-pc-01",
        "local_ip": "192.168.1.30",
        "operating_system": "Windows 11",
        "platform": "windows",
        "cpu_cores": 12,
        "total_ram": 32768,
        "is_online": False
    }
]

for i, agent in enumerate(agents, 1):
    try:
        # Пробуем с токеном
        resp = requests.post(
            f"{BASE}/api/v1/agents/register",
            headers=headers,
            json=agent
        )

        if resp.status_code == 200:
            print(f"   ✅ Агент {i} ({agent['hostname']}): зарегистрирован")
            agent_data = resp.json()
            print(f"      🆔 ID: {agent_data.get('agent_id')}")
            print(f"      🖥️  Хост: {agent_data.get('hostname')}")
        else:
            print(f"   ⚠️  Агент {i}: ошибка {resp.status_code}")
            print(f"      📄 Ответ: {resp.text[:100]}")

    except Exception as e:
        print(f"   ❌ Ошибка при регистрации агента: {e}")

# 5. Получение списка агентов
print("\n📋 5. Получение списка всех агентов:")
try:
    resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)

    if resp.status_code == 200:
        agents_list = resp.json()
        print(f"   ✅ Найдено агентов: {len(agents_list)}")

        if agents_list:
            print(f"   📊 Статистика:")
            online = sum(1 for a in agents_list if a.get('is_online'))
            print(f"      🟢 Онлайн: {online}")
            print(f"      🔴 Оффлайн: {len(agents_list) - online}")

            print(f"\n   🖥️  Список агентов:")
            for agent in agents_list[:5]:  # Покажем первые 5
                status = "🟢" if agent.get('is_online') else "🔴"
                print(f"      {status} {agent.get('agent_id')}: {agent.get('hostname')}")

            if len(agents_list) > 5:
                print(f"      ... и еще {len(agents_list) - 5} агентов")
    else:
        print(f"   ❌ Ошибка: {resp.status_code}")
        print(f"   📄 Ответ: {resp.text}")

except Exception as e:
    print(f"   ❌ Исключение: {e}")

# 6. Проверка веб-интерфейса
print("\n🌐 6. Проверка веб-интерфейса:")
web_pages = [
    ("/dashboard", "Дашборд"),
    ("/agents", "Список агентов"),
    ("/login", "Страница входа"),
]

for page, description in web_pages:
    try:
        resp = requests.get(f"{BASE}{page}")
        if resp.status_code == 200:
            print(f"   ✅ {description}: доступен")
        elif resp.status_code == 303:  # Redirect
            print(f"   🔀 {description}: перенаправление")
        else:
            print(f"   ⚠️  {description}: {resp.status_code}")
    except Exception as e:
        print(f"   ❌ {description}: {e}")

print("\n" + "=" * 60)
print("🎯 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ")
print("=" * 60)
print("\n📌 Следующие шаги:")
print("1. 📖 Откройте документацию: http://localhost:8000/docs")
print("2. 🖥️  Проверьте веб-интерфейс: http://localhost:8000/dashboard")
print("3. 🔧 Настройте аутентификацию для нужных эндпоинтов")
print("4. 📊 Добавьте больше функционала для агентов")
print("\n✨ Тестирование завершено!")