import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash
from app.config import settings

def create_first_admin():
    """Создает первого администратора"""
    db = SessionLocal()
    try:
        # Проверяем существование пользователя
        existing_user = db.query(User).filter(User.username == settings.FIRST_SUPERUSER).first()

        if existing_user:
            print(f"ℹ️ User '{settings.FIRST_SUPERUSER}' already exists")

            # Обновляем пароль если нужно
            if not existing_user.is_admin:
                existing_user.is_admin = True
                db.commit()
                print(f"ℹ️ User '{settings.FIRST_SUPERUSER}' updated to admin")
            return

        # Хешируем пароль
        hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)

        # Создаем нового пользователя
        admin_user = User(
            username=settings.FIRST_SUPERUSER,
            email=f"{settings.FIRST_SUPERUSER}@sysdm.local",
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✅ Admin user '{settings.FIRST_SUPERUSER}' created successfully")
        print(f"   Username: {settings.FIRST_SUPERUSER}")
        print(f"   Password: {settings.FIRST_SUPERUSER_PASSWORD}")

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    create_first_admin()