# app/utils/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
import hashlib

# Инициализируем контекст хеширования
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Тестируем bcrypt
    test_hash = pwd_context.hash("test")
    print("✅ bcrypt работает корректно")
    USE_BCRYPT = True
except Exception as e:
    print(f"⚠️ bcrypt не работает, используем sha256 как fallback: {e}")
    USE_BCRYPT = False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    print(f"DEBUG verify_password called")
    print(f"  plain_password: '{plain_password}'")
    print(f"  hashed_password: '{hashed_password}'")

    if not plain_password or not hashed_password:
        print(f"  ERROR: Missing password or hash")
        return False

    try:
        if USE_BCRYPT:
            # Проверяем через bcrypt
            result = pwd_context.verify(plain_password, hashed_password)
            print(f"  Using bcrypt, result: {result}")
            return result
        else:
            # Проверяем через SHA256 (fallback)
            test_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            result = test_hash == hashed_password
            print(f"  Using SHA256, result: {result}")
            return result
    except Exception as e:
        print(f"  Exception in verify_password: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Хеширует пароль"""
    # Ограничиваем длину для bcrypt
    if len(password) > 72:
        password = password[:72]

    if USE_BCRYPT:
        try:
            return pwd_context.hash(password)
        except Exception as e:
            print(f"⚠️ bcrypt failed, falling back to SHA256: {e}")
            # Fallback на sha256
            return hashlib.sha256(password.encode()).hexdigest()
    else:
        # Используем sha256
        return hashlib.sha256(password.encode()).hexdigest()

# Функции для работы с JWT токенами (оставить без изменений)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str):
    """Декодирует JWT токен"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None