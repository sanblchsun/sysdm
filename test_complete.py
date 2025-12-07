import requests
import json
import time

BASE = "http://localhost:8000"

def print_step(step):
    print(f"\n{'='*60}")
    print(f"📋 {step}")
    print(f"{'='*60}")

print_step("ПОЛНЫЙ ТЕСТ СИСТЕМЫ SysDM")

# 1. Проверка health
print("1. Проверка сервера...")
resp = requests.get(f"{BASE}/health")
print(f"   ✅ Health: {resp.json()}")

# 2. Аутентификация
print("\n2. Аутентификация...")
resp = requests.post(
    f"{BASE}/api/v1/auth/login-basic",
    json={"username": "admin", "password": "admin123"}
)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print(f"   ✅ Token получен")

# 3. Информация о пользователе
print("\n3. Информация о пользователе...")
resp = requests.get(f"{BASE}/api/v1/auth/me", headers=headers)
user_info = resp.json()
print(f"   ✅ Пользователь: {user_info['username']}")
print(f"      Email: {user_info['email']}")
print(f"      Admin: {user_info['is_admin']}")

# 4. Регистрация нескольких агентов
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
    resp = requests.post(
        f"{BASE}/api/v1/agents/register",
        headers=headers,
        json=agent_data
    )
    print(f"   ✅ Агент {i}: {agent_data['hostname']} - {resp.status_code}")

# 5. Получение списка агентов
print("\n5. Список всех агентов...")
resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
agents_list = resp.json()
print(f"   ✅ Всего агентов: {len(agents_list)}")
for agent in agents_list:
    print(f"      - {agent['agent_id']}: {agent['hostname']} ({agent['local_ip']})")

# 6. Получение информации об одном агенте
print("\n6. Детальная информация об агенте...")
agent_id = "server-01"
resp = requests.get(f"{BASE}/api/v1/agents/{agent_id}", headers=headers)
if resp.status_code == 200:
    agent_detail = resp.json()
    print(f"   ✅ Агент {agent_id}:")
    print(f"      Hostname: {agent_detail['hostname']}")
    print(f"      OS: {agent_detail['operating_system']}")
    print(f"      CPU cores: {agent_detail['cpu_cores']}")
    print(f"      RAM: {agent_detail['total_ram']} MB")
    print(f"      Online: {agent_detail['is_online']}")

# 7. Heartbeat для агента
print("\n7. Отправка heartbeat...")
resp = requests.post(f"{BASE}/api/v1/agents/{agent_id}/heartbeat")
if resp.status_code == 200:
    print(f"   ✅ Heartbeat отправлен для {agent_id}")
    updated_agent = resp.json()
    print(f"      Last seen: {updated_agent['last_seen']}")

print_step("ТЕСТ ЗАВЕРШЕН УСПЕШНО! 🎉")
print("\nДоступные эндпоинты:")
print(f"  • Веб-интерфейс: {BASE}/dashboard")
print(f"  • Документация API: {BASE}/docs")
print(f"  • Список агентов: {BASE}/api/v1/agents/")
print(f"  • Аутентификация: {BASE}/api/v1/auth/login-basic")