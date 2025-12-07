import hashlib

# Хэш из базы данных (первые 64 символа)
db_hash = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
password = "admin123"

# Вычисляем хэш пароля
calculated_hash = hashlib.sha256(password.encode()).hexdigest()

print(f"Пароль: {password}")
print(f"Хэш из БД:    {db_hash}")
print(f"Вычисленный:  {calculated_hash}")
print(f"Совпадают: {db_hash == calculated_hash}")
print(f"Длина БД хэша: {len(db_hash)}")
print(f"Длина вычисленного: {len(calculated_hash)}")