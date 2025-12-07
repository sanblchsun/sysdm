import sys
sys.path.append('.')
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
import hashlib

db = SessionLocal()
try:
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        print(f"✅ Администратор найден:")
        print(f"   ID: {admin.id}")
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Is admin: {admin.is_admin}")
        print(f"   Is active: {admin.is_active}")
        print(f"   Password hash: {admin.hashed_password[:30]}...")

        # Проверим пароль
        test_password = "admin123"
        test_hash = hashlib.sha256(test_password.encode()).hexdigest()
        print(f"\n🔐 Проверка пароля:")
        print(f"   Введенный пароль: {test_password}")
        print(f"   Хэш введенного пароля: {test_hash[:30]}...")
        print(f"   Хэш в базе: {admin.hashed_password[:30]}...")
        print(f"   Совпадает: {test_hash == admin.hashed_password}")
    else:
        print("❌ Администратор не найден в базе")
finally:
    db.close()