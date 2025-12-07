import requests
import json

BASE = "http://localhost:8000"

print("1. Аутентификация...")
resp = requests.post(
    f"{BASE}/api/v1/auth/login-basic",
    json={"username": "admin", "password": "admin123"}
)
print(f"   Status: {resp.status_code}")
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("\n2. Минимальные данные для теста...")
simple_data = {
    "agent_id": "debug-test-001",
    "hostname": "debug-host",
    "local_ip": "192.168.1.100"
}

print(f"   Отправка: {json.dumps(simple_data, indent=2)}")

resp = requests.post(
    f"{BASE}/api/v1/agents/register",
    headers=headers,
    json=simple_data
)

print(f"\n   Status: {resp.status_code}")
print(f"   Headers: {dict(resp.headers)}")
print(f"   Response text: {resp.text}")

if resp.status_code == 500:
    print("\n   Проверьте логи сервера для деталей ошибки...")