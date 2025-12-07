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

print("\n2. Тест GET /api/v1/agents/...")
resp = requests.get(f"{BASE}/api/v1/agents/", headers=headers)
print(f"   Status: {resp.status_code}")
print(f"   Response: {resp.json()}")

print("\n3. Тест регистрации агента...")
agent_data = {
    "agent_id": "test-agent-001",
    "hostname": "test-server",
    "local_ip": "192.168.1.100",
    "public_ip": "8.8.8.8",
    "mac_address": "00:11:22:33:44:55",
    "operating_system": "Ubuntu 22.04",
    "platform": "linux",
    "architecture": "x86_64",
    "cpu_model": "Intel Xeon",
    "cpu_cores": 8,
    "total_ram": 16384,
    "site_id": "main-dc",
    "department": "IT",
    "description": "Test server"
}

resp = requests.post(
    f"{BASE}/api/v1/agents/register",
    headers=headers,
    json=agent_data
)
print(f"   Status: {resp.status_code}")
if resp.status_code != 200:
    print(f"   Error details: {resp.json()}")
else:
    print(f"   Success: {resp.json()}")