import requests
import json

BASE = "http://localhost:8000"

print("Тестирование аутентификации...")
print(f"URL: {BASE}/api/v1/auth/login-basic")

resp = requests.post(
    f"{BASE}/api/v1/auth/login-basic",
    json={"username": "admin", "password": "admin123"}
)

print(f"Status Code: {resp.status_code}")
print(f"Headers: {dict(resp.headers)}")
print(f"Response Text: {resp.text}")

if resp.status_code == 200:
    try:
        data = resp.json()
        print(f"JSON Response: {json.dumps(data, indent=2)}")
        print(f"Keys in response: {list(data.keys())}")
    except:
        print("Response is not JSON")