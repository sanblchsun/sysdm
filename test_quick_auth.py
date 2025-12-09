# quick_auth_test.py
import requests
import json
from app.config import settings

BASE = "http://localhost:8000"

# Тестируем разные варианты аутентификации
test_cases = [
    {
        "url": "/api/v1/auth/login",
        "data": {"username": settings.FIRST_SUPERUSER, "password": settings.FIRST_SUPERUSER_PASSWORD},
        "content_type": "application/x-www-form-urlencoded"
    },
    {
        "url": "/api/v1/auth/login",
        "json": {"username": settings.FIRST_SUPERUSER, "password": settings.FIRST_SUPERUSER_PASSWORD},
        "content_type": "application/json"
    },
    {
        "url": "/token",
        "data": {"username": settings.FIRST_SUPERUSER, "password": settings.FIRST_SUPERUSER_PASSWORD},
        "content_type": "application/x-www-form-urlencoded"
    },
    {
        "url": "/api/v1/auth/token",
        "data": {"username": settings.FIRST_SUPERUSER, "password": settings.FIRST_SUPERUSER_PASSWORD},
        "content_type": "application/x-www-form-urlencoded"
    }
]

for i, test in enumerate(test_cases, 1):
    print(f"\nТест {i}: POST {test['url']}")

    headers = {}
    if "content_type" in test:
        headers["Content-Type"] = test["content_type"]

    try:
        if "json" in test:
            resp = requests.post(BASE + test["url"], json=test["json"], headers=headers)
        else:
            resp = requests.post(BASE + test["url"], data=test["data"], headers=headers)

        print(f"  Статус: {resp.status_code}")
        print(f"  Ответ: {resp.text[:200]}")

        if resp.status_code == 200:
            print("  ✅ УСПЕХ!")
            try:
                data = resp.json()
                print(f"  Данные: {json.dumps(data, indent=2)}")
            except:
                print("  (не JSON ответ)")
    except Exception as e:
        print(f"  ❌ Ошибка: {e}")