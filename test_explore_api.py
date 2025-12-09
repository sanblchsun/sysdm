# explore_api.py
import requests

BASE = "http://localhost:8000"

print("=== Исследование API SysDM ===")

# 1. Получить OpenAPI схему
print("\n1. Получаем OpenAPI схему...")
try:
    resp = requests.get(f"{BASE}/openapi.json")
    if resp.status_code == 200:
        openapi = resp.json()

        # Находим все пути
        print("\nДоступные эндпоинты:")
        for path, methods in openapi["paths"].items():
            print(f"\n{path}:")
            for method, details in methods.items():
                print(f"  {method.upper()}: {details.get('summary', 'Без описания')}")
                if "tags" in details:
                    print(f"    Теги: {', '.join(details['tags'])}")

        # Ищем auth эндпоинты
        print("\n\n=== АУТЕНТИФИКАЦИЯ ===")
        auth_paths = {}
        for path, methods in openapi["paths"].items():
            for method, details in methods.items():
                if any(tag in str(details).lower() for tag in ['auth', 'login', 'token']):
                    auth_paths[path] = methods
                    break

        for path, methods in auth_paths.items():
            print(f"\n{path}:")
            for method, details in methods.items():
                print(f"  {method.upper()}: {details.get('summary', '')}")
                if "requestBody" in details:
                    print(f"    Тело запроса требуется")

except Exception as e:
    print(f"Ошибка: {e}")

# 2. Проверить docs
print("\n\n2. Доступные документации:")
docs_urls = [
    "/docs",
    "/redoc",
    "/swagger",
    "/swagger-ui"
]

for url in docs_urls:
    try:
        resp = requests.get(f"{BASE}{url}")
        if resp.status_code == 200:
            print(f"✅ {url} - доступен")
        else:
            print(f"❌ {url} - недоступен ({resp.status_code})")
    except:
        print(f"❌ {url} - ошибка соединения")