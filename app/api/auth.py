from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext

from app.database import get_session
from app.models.users import User
from app.core.auth import (
    create_access_token,
    get_current_active_user,
    get_current_admin_user,
)

router = APIRouter(tags=["Аутентификация"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Получить хеш пароля"""
    return pwd_context.hash(password)


async def authenticate_user(
    session: AsyncSession, username: str, password: str
) -> User | None:
    """Аутентифицировать пользователя"""
    result = await session.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, str(user.hashed_password)):
        return None

    return user


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    """Войти в систему и получить токен"""
    user = await authenticate_user(session, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "is_admin": user.is_admin,
    }


# ========== ТОЛЬКО ДЛЯ АДМИНИСТРАТОРОВ ==========


@router.post("/register")
async def admin_register(
    username: str,
    password: str,
    email: str = None,  # type: ignore
    is_admin: bool = False,
    is_active: bool = True,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),  # Только админы!
):
    """Создать нового пользователя (только для администраторов)"""

    # Проверяем существование пользователя
    result = await session.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")

    # Хешируем пароль
    hashed_password = get_password_hash(password)

    # Создаём пользователя
    user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_active=is_active,
        is_admin=is_admin,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "message": "Пользователь создан",
        "username": username,
        "is_admin": is_admin,
        "is_active": is_active,
        "created_by": current_user.username,
    }


@router.get("/users")
async def list_users(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),  # Только админы!
):
    """Показать всех пользователей (только для администраторов)"""
    result = await session.execute(select(User))
    users = result.scalars().all()

    return {
        "total": len(users),
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "is_active": user.is_active,
            }
            for user in users
        ],
    }
