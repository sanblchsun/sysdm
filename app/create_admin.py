from database import SessionLocal
from models import User
from auth import hash_password
from crud import get_user_by_username

def create_admin_interactive():
    db = SessionLocal()
    try:
        username = input("Admin username: ").strip()
        password = input("Admin password: ").strip()
        if not username or not password:
            print("username and password are required")
            return
        if get_user_by_username(db, username):
            print("User already exists")
            return
        hashed = hash_password(password)
        admin = User(username=username, hashed_password=hashed, role="admin", is_active=True)
        db.add(admin)
        db.commit()
        print("Admin created:", username)
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_interactive()
