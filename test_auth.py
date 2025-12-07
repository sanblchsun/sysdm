import requests

# Тестируем аутентификацию
BASE_URL = "http://localhost:8000"

def test_login():
    """Тест входа в систему"""
    # Способ 1: через OAuth2 форму (стандартный)
    print("Testing OAuth2 login...")
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Способ 2: через JSON (альтернативный)
    print("\nTesting JSON login...")
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login-basic",
        json={"username": "admin", "password": "admin123"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    return response.json().get("access_token")

def test_protected_endpoint(token):
    """Тест защищенного эндпоинта"""
    print("\nTesting protected endpoint...")
    response = requests.get(
        f"{BASE_URL}/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    token = test_login()
    if token:
        test_protected_endpoint(token)