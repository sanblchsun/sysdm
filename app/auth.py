import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-super-secret")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "change-me-refresh-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_ctx.verify(password, hashed)

def create_access_token(sub: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=(expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": sub, "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": sub, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def decode_refresh_token(token: str):
    return jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
