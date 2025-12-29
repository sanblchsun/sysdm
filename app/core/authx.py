from datetime import timedelta
from authx import AuthX, AuthXConfig
from app.config import settings



# Конфигурация AuthX
config = AuthXConfig()
JWT_ACCESS_TOKEN_EXPIRES = (timedelta(minutes=15),)
JWT_REFRESH_TOKEN_EXPIRES = (timedelta(days=20),)
config.JWT_SECRET_KEY = settings.SECRET_KEY
config.JWT_ALGORITHM = "HS256"
config.JWT_TOKEN_LOCATION = ["cookies"]
config.JWT_COOKIE_SECURE = True
config.JWT_COOKIE_HTTP_ONLY = True
config.JWT_COOKIE_SAMESITE = "lax"
config.JWT_CSRF_IN_COOKIES = True
config.JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
from fastapi.security import OAuth2PasswordBearer
from app.database import get_session
from sqlalchemy.future import select

auth = AuthX(config=config)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

