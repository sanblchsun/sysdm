# test_password.py
from app.utils.security import verify_password, get_password_hash

# Тестовый пароль
test_password = "112233"
# Хеш из базы
stored_hash = "$2b$12$L.womigp3hjjIBI7dmWjr.KerURedkWs75D0uWNr8.buhXK28ivuy"

print(f"Testing password: {test_password}")
print(f"Stored hash: {stored_hash}")

# Проверяем
is_valid = verify_password(test_password, stored_hash)
print(f"Password matches hash: {is_valid}")

# Генерируем новый хеш для сравнения
new_hash = get_password_hash(test_password)
print(f"New hash for same password: {new_hash}")
print(f"New hash equals stored hash: {new_hash == stored_hash}")