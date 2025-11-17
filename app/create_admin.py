from database import SessionLocal
from models import User
from auth import hash_password

db = SessionLocal()

username = input("Имя пользователя: ")
password = input("Пароль: ")

hashed = hash_password(password)

admin = User(
    username=username,
    hashed_password=hashed,
    role="admin",
    is_active=True
)

db.add(admin)
db.commit()
db.close()

print(f"Admin {username} создан")
