from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import get_password_hash, verify_password

def get_user_by_username(db: Session, username: str):
    """Получает пользователя по имени"""
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    """Создает нового пользователя"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    """Аутентифицирует пользователя"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Получает список пользователей"""
    return db.query(User).offset(skip).limit(limit).all()