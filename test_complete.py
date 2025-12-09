# test_complete.py
import requests
import json
import time
from app.config import settings

BASE = "http://localhost:8000"

def print_step(step):
    print(f"\n{'='*60}")
    print(f"📋 {step}")
    print(f"{'='*60}")

def login():
    """Аутентификация с обработкой разных форматов ответа"""
    print("\n2. Аутентификация...")

    # Пробуем разные варианты
    endpoints = [
        "/api/v1/auth/login",
        "/api/v1/auth/login-basic",
        "/api/v1/auth/token",
        "/login"
    ]

    credentials = {"username": settings.FIRST_SUPERUSER, "password": settings.FIRST_SUPERUSER_PASSWORD}

    for endpoint in endpoints:
        try:
            print(f"   Пробуем {endpoint}...")
            resp = requests.post(
                f"{BASE}{endpoint}",
                data=credentials  # Используем data вместо json для form-data
            )

            print(f"   Status: {resp.status_code}")
            print(f"   Response: {resp.text[:100]}...")

            if resp.status_code == 200:
                response_data = resp.json()

                # Проверяем разные возможные ключи
                if "access_token" in response_data:
                    token = response_data["access_token"]
                    print(f"   ✅ Token получен из 'access_token'")
                    return token
                elif "token" in response_data:
                    token = response_data["token"]
                    print(f"   ✅ Token получен из 'token'")
                    return token
                else:
                    print(f"   ⚠️ Непонятный формат: {list(response_data.keys())}")

        except Exception as e:
            print(f"   ❌ Ошибка: {e}")
            continue

    # Если ничего не сработало, попробуем через headers
    print("\n   Пробуем с headers...")
    try:
        resp = requests.post(
            f"{BASE}/api/v1/auth/login",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data=credentials
        )
        if resp.status_code == 200:
            return resp.json()["access_token"]
    except:
        pass

    raise Exception("Не удалось аутентифицироваться")

print_step("ПОЛНЫЙ ТЕСТ СИСТЕМЫ SysDM")

# 1. Проверка health
print("1. Проверка сервера...")
resp = requests.get(f"{BASE}/health")
print(f"   ✅ Health: {resp.json()}")

# 2. Аутентификация
try:
    token = login()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
except Exception as e:
    print(f"   ❌ Ошибка аутентификации: {e}")

    # Покажем доступные эндпоинты
    print("\n   Проверяем доступные эндпоинты...")
    try:
        resp = requests.get(f"{BASE}/openapi.json")
        if resp.status_code == 200:
            openapi = resp.json()
            auth_paths = {k: v for k, v in openapi["paths"].items() if "auth" in k or "login" in k or "token" in k}
            print("   Найденные auth эндпоинты:")
            for path, methods in auth_paths.items():
                print(f"      {path}: {list(methods.keys())}")
    except:
        print("   Не удалось получить openapi.json")

    # Завершаем скрипт
    exit(1)

# 3. Информация о пользователе
print("\n3. Информация о пользователе...")
try:
    resp = requests.get(f"{BASE}/api/v1/auth/me", headers=headers)
    if resp.status_code == 200:
        user_info = resp.json()
        print(f"   ✅ Пользователь: {user_info['username']}")
        print(f"      Email: {user_info.get('email', 'N/A')}")
        print(f"      Admin: {user_info.get('is_admin', 'N/A')}")
    else:
        print(f"   ❌ Ошибка: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"   ❌ Ошибка: {e}")

# Дальнейшие шаги только если аутентификация успешна
if 'token' in locals():
    # 4. Регистрация агентов
    print("\n4. Регистрация агентов...")
    agents = [
        {
            "agent_id": "server-01",
            "hostname": "web-server-01",
            "local_ip": "192.168.1.10",
            "operating_system": "Ubuntu 22.04",
            "platform": "linux",
            "cpu_cores": 4,
            "total_ram": 8192
        },
        {
            "agent_id": "server-02",
            "hostname": "db-server-01",
            "local_ip": "192.168.1.20",
            "operating_system": "CentOS 7",
            "platform": "linux",
            "cpu_cores": 8,
            "total_ram": 16384
        },
        {
            "agent_id": "workstation-01",
            "hostname": "win-pc-01",
            "local_ip": "192.168.1.30",
            "operating_system": "Windows 11",
            "platform": "windows",
            "cpu_cores": 12,
            "total_ram": 32768
        }
    ]

    for i, agent_data in enumerate(agents, 1):
        try:
            resp = requests.post(
                f"{BASE}/api/v1/agents/register",
                headers=headers,
                json=agent_data
            )
            if resp.status_code == 200:
                print(f"   ✅ Агент {i}: {agent_data['hostname']} - зарегистрирован")
            else:
                print(f"   ⚠️  Агент {i}: {agent_data['hostname']} - ошибка {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"   ❌ Ошибка при регистрации агента: {e}")

    # 5. Получение списка агентов
    print("\n5. Список всех агентов...")
    try:
        resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
        if resp.status_code == 200:
            agents_list = resp.json()
            print(f"   ✅ Всего агентов: {len(agents_list)}")
            for agent in agents_list[:5]:  # Покажем только первые 5
                print(f"      - {agent.get('agent_id', 'N/A')}: {agent.get('hostname', 'N/A')}")
            if len(agents_list) > 5:
                print(f"      ... и еще {len(agents_list) - 5} агентов")
        else:
            print(f"   ❌ Ошибка: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")

    print_step("ТЕСТ ЗАВЕРШЕН! 🎉")

print("\nДоступные эндпоинты для проверки вручную:")
print(f"  • Документация API: {BASE}/docs")
print(f"  • OpenAPI схема: {BASE}/openapi.json")
print(f"  • Redoc: {BASE}/redoc")
print(f"  • Веб-интерфейс: {BASE}/dashboard")