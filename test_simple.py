# test_simple.py
import requests
import json

BASE = "http://localhost:8000"

print("1. Тест аутентификации...")
resp = requests.post(
    f"{BASE}/api/v1/auth/login-basic",
    json={"username": "admin", "password": "admin123"}
)
print(f"   Status: {resp.status_code}")
print(f"   JSON: {resp.json()}")

token = resp.json()["access_token"]
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("\n2. Тест /me...")
resp = requests.get(f"{BASE}/api/v1/auth/me", headers=headers)
print(f"   Status: {resp.status_code}")
print(f"   JSON: {resp.json()}")

print("\n3. Тест GET /agents...")
resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
print(f"   Status: {resp.status_code}")
print(f"   JSON: {resp.json()}")

print("\n4. Тест регистрации агента...")
resp = requests.post(
    f"{BASE}/api/v1/agents/register",
    headers=headers,
    json={
        "agent_id": "simple-test-001",
        "hostname": "simple-host",
        "local_ip": "192.168.0.1"
    }
)
print(f"   Status: {resp.status_code}")
print(f"   JSON: {resp.json() if resp.text else 'Empty response'}")