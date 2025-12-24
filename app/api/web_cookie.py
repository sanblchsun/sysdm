from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pathlib import Path
from app.config import settings
from app.database import get_session
from app.models.users import User
from app.core.auth import create_access_token, get_current_user
from app.api.auth import authenticate_user

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def root():
    """Корневой путь - перенаправление на логин"""
    return RedirectResponse(url="/login", status_code=302)


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Страница входа"""
    return templates.TemplateResponse(
        "login_nojs.html", {"request": request, "error": None}
    )


@router.post("/login", response_class=HTMLResponse)
async def login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    session: AsyncSession = Depends(get_session),
):
    """Обработка формы входа"""
    user = await authenticate_user(session, username, password)

    if not user:
        return templates.TemplateResponse(
            "login_nojs.html",
            {"request": request, "error": "❌ Неверный логин или пароль"},
        )

    # Создаем JWT токен
    token = create_access_token(data={"sub": user.username})

    # Перенаправляем на страницу агентов с установкой cookie
    response = RedirectResponse(url="/agents", status_code=302)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
    )
    return response


@router.get("/agents", response_class=HTMLResponse)
async def agents_page(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),  # Проверяем через cookie
):
    """Страница агентов с серверным рендерингом"""

    # Получаем список агентов (используем ваш существующий эндпоинт)
    # Импортируем здесь, чтобы избежать циклических импортов
    from app.api.agents import get_agents

    agents_data = await get_agents(current_user)

    return templates.TemplateResponse(
        "agents_nojs.html",
        {"request": request, "user": current_user, "agents": agents_data},
    )


@router.get("/logout")
async def logout():
    """Выход - удаляем cookie и перенаправляем на логин"""
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie(key="access_token")
    return response
