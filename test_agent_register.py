# test_agent_register.py
import requests
import json

BASE = "http://localhost:8000"

print("=== ТЕСТ РЕГИСТРАЦИИ АГЕНТА ===")

# 1. Пробуем зарегистрировать агента без аутентификации
agent_data = {
    "agent_id": "test-agent-001",
    "hostname": "test-server",
    "local_ip": "192.168.1.100",
    "operating_system": "Ubuntu 20.04",
    "platform": "linux",
    "cpu_cores": 4,
    "total_ram": 8192,
    "agent_version": "1.0.0",
    "is_online": True
}

print("\n1. Регистрация агента (публичный эндпоинт):")
resp = requests.post(
    f"{BASE}/api/v1/agents/register",
    json=agent_data
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:200]}")

if resp.status_code == 201:
    print("✅ Агент успешно зарегистрирован!")
    agent_info = resp.json()
    print(f"   Agent ID: {agent_info.get('agent_id')}")
    print(f"   Hostname: {agent_info.get('hostname')}")
    print(f"   Status: {agent_info.get('message')}")
else:
    print("❌ Ошибка регистрации агента")

# 2. Heartbeat для агента
print("\n2. Heartbeat для агента:")
resp = requests.post(
    f"{BASE}/api/v1/agents/test-agent-001/heartbeat"
)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:200]}")

# 3. Аутентификация и получение списка агентов
print("\n3. Аутентификация и получение списка агентов:")
resp = requests.post(
    f"{BASE}/api/v1/auth/login",
    data={"username": "admin", "password": "112233"}
)

if resp.status_code == 200:
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Получаем список агентов
    resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
    print(f"Status списка агентов: {resp.status_code}")

    if resp.status_code == 200:
        agents = resp.json()
        print(f"✅ Найдено агентов: {len(agents)}")
        for agent in agents[:3]:  # Показать первые 3
            print(f"   - {agent.get('agent_id')}: {agent.get('hostname')}")
    else:
        print(f"❌ Ошибка: {resp.text}")
else:
    print("❌ Ошибка аутентификации")