import requests
import sys

BASE_URL = "http://localhost:8000"

print("Тестирование входа через веб-форму...")
print("="*50)

# Отправляем POST запрос как браузер
data = {
    "username": "admin",
    "password": "admin123",
    "remember": "false"
}

headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "TestDebug/1.0"
}

try:
    print(f"Отправка POST запроса на {BASE_URL}/login")
    print(f"Данные: {data}")

    response = requests.post(
        f"{BASE_URL}/login",
        data=data,
        headers=headers,
        allow_redirects=False  # Не следовать редиректам
    )

    print(f"\nСтатус код: {response.status_code}")
    print(f"Заголовки ответа:")
    for header, value in response.headers.items():
        print(f"  {header}: {value}")

    print(f"\nТело ответа (первые 500 символов):")
    print(response.text[:500])

    print(f"\nCookies в ответе:")
    for cookie in response.cookies:
        print(f"  {cookie.name}: {cookie.value[:50]}...")

    # Если есть редирект
    if response.status_code in [301, 302, 303, 307, 308]:
        location = response.headers.get('Location')
        print(f"\nРедирект на: {location}")

        # Попробуем перейти по редиректу
        if location:
            print(f"\nПроверка редиректа на {location}...")
            redirect_response = requests.get(
                f"{BASE_URL}{location}" if location.startswith("/") else location,
                cookies=response.cookies,
                headers=headers
            )
            print(f"Статус редиректа: {redirect_response.status_code}")

except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()