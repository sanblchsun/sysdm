import sys
sys.path.append('.')
from app.crud.user import authenticate_user
from app.database import SessionLocal

print("Тестирование authenticate_user напрямую...")

db = SessionLocal()
try:
    result = authenticate_user(db, "admin", "admin123")
    print(f"Результат: {result}")
    if result:
        print(f"Успех! Пользователь: {result.username}")
    else:
        print("Ошибка: authenticate_user вернул None")
except Exception as e:
    print(f"Исключение: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()