# test_final.py
import requests
import json

BASE = "http://localhost:8000"

print("1. Аутентификация...")
resp = requests.post(
    f"{BASE}/api/v1/auth/login-basic",
    json={"username": "admin", "password": "Ghjuhtcc123"}
)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("\n2. Тест создания агента...")
test_data = {
    "agent_id": "final-test-001",
    "hostname": "final-host",
    "local_ip": "192.168.1.100",
    "disk_space": {"C:": {"total": 500, "free": 300}}  # Пример структуры
}

resp = requests.post(
    f"{BASE}/api/v1/agents/register",
    headers=headers,
    json=test_data
)

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    print(f"Success! Agent created: {resp.json()['agent_id']}")
else:
    print(f"Error: {resp.text}")

print("\n3. Проверка списка агентов...")
resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
print(f"Status: {resp.status_code}")
agents = resp.json()
print(f"Total agents: {len(agents)}")
for agent in agents:
    print(f"  - {agent['agent_id']}: {agent['hostname']}")
