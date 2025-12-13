# app/web/routes.py
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud.user import authenticate_user, get_user_by_username
from app.utils.security import create_access_token, decode_access_token
from app.config import settings
from app.crud.agent import (
    get_agents,
    get_agent_by_agent_id,
    get_agents_statistics,
    get_online_agents,
    create_agent,
    update_agent,
    delete_agent,
    update_agent_heartbeat,
    search_agents
)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# =========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===========

def get_template_context(request: Request, extra: dict = None):
    """Базовый контекст для всех шаблонов"""
    context = {
        "request": request,
        "settings": settings,
        "year": datetime.now().year,
        "now": datetime.now,  # ДОБАВЛЯЕМ ФУНКЦИЮ now
        "current_user": None,
        "humanize_time": humanize_time  # ДОБАВЛЯЕМ ФУНКЦИЮ
    }

    # Проверяем токен из cookies (для старого интерфейса)
    token = request.cookies.get("access_token")
    if token:
        username = decode_access_token(token)
        if username:
            user = get_user_by_username(next(get_db()), username)
            if user:
                context["current_user"] = {
                    "username": user.username,
                    "email": user.email,
                    "is_admin": user.is_admin,
                    "is_active": user.is_active
                }

    if extra:
        context.update(extra)

    return context

def humanize_time(dt):
    """Человекочитаемое время"""
    if not dt:
        return "никогда"

    now = datetime.now()
    diff = now - dt

    if diff < timedelta(minutes=1):
        return "только что"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} минут назад"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} часов назад"
    elif diff < timedelta(days=30):
        days = diff.days
        return f"{days} дней назад"
    else:
        return dt.strftime('%Y-%m-%d')

# =========== СТАРЫЙ ИНТЕРФЕЙС (Jinja2) ===========

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Страница входа (старый интерфейс)"""
    # Если уже авторизован, перенаправляем
    token = request.cookies.get("access_token")
    if token and decode_access_token(token):
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

    context = get_template_context(request, {
        "hide_nav": True,
        "hide_footer": True
    })
    return templates.TemplateResponse("login.html", context)

@router.post("/login", response_class=HTMLResponse)
async def web_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Обработка входа через веб-форму (старый интерфейс)"""
    # Аутентификация
    user = authenticate_user(db, username=username, password=password)

    if not user or not user.is_active:
        context = get_template_context(request, {
            "hide_nav": True,
            "hide_footer": True,
            "error": "Неверное имя пользователя или пароль",
            "username": username
        })
        return templates.TemplateResponse("login.html", context)

    # Создаем токен
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES * (24 * 7 if remember else 1)
    )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    # Перенаправляем на dashboard
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

    # Сохраняем токен в cookie
    max_age = access_token_expires.total_seconds() if remember else None
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=max_age,
        secure=False,
        samesite="lax"
    )

    return response

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    """Дашборд (старый интерфейс)"""
    # Проверяем авторизацию
    token = request.cookies.get("access_token")
    if not token or not decode_access_token(token):
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

    # Получаем агентов
    agents = get_agents(db, limit=100)
    online_agents = [a for a in agents if a.is_online]
    offline_agents = [a for a in agents if not a.is_online]

    # ВЫЧИСЛЯЕМ unknown_os_count для исправления ошибки
    unknown_os_count = 0  # Временное значение

    context = get_template_context(request, {
        "page_title": "Дашборд",
        "total_agents": len(agents),
        "online_agents": len(online_agents),
        "offline_agents": len(offline_agents),
        "recent_agents": agents[:5],
        "current_time": datetime.now().strftime('%H:%M:%S'),
        "unknown_os_count": unknown_os_count,  # ДОБАВЛЯЕМ
        "os_stats": [],  # ДОБАВЛЯЕМ
        "os_data_json": "{}"  # ДОБАВЛЯЕМ
    })
    return templates.TemplateResponse("dashboard.html", context)

@router.get("/agents", response_class=HTMLResponse)
async def web_agents_list(request: Request, db: Session = Depends(get_db)):
    """Страница со списком агентов (старый интерфейс)"""
    # Проверяем авторизацию
    token = request.cookies.get("access_token")
    if not token or not decode_access_token(token):
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

    agents = get_agents(db, limit=100)

    context = get_template_context(request, {
        "page_title": "Агенты",
        "agents": agents
    })
    return templates.TemplateResponse("agents/list.html", context)

@router.get("/logout")
async def logout():
    """Выход из системы (старый интерфейс)"""
    response = RedirectResponse(url="/login")
    response.delete_cookie("access_token")
    response.delete_cookie("user_info")
    return response

# =========== НОВЫЙ SPA ИНТЕРФЕЙС ===========

@router.get("/spa", response_class=HTMLResponse)
async def spa_index(request: Request, db: Session = Depends(get_db)):
    """SPA точка входа (новый интерфейс)"""
    # Проверяем авторизацию через cookie
    token = request.cookies.get("access_token")
    current_user = None

    if token:
        username = decode_access_token(token)
        if username:
            user = get_user_by_username(db, username=username)
            if user:
                current_user = {
                    "username": user.username,
                    "email": user.email,
                    "is_admin": user.is_admin,
                    "is_active": user.is_active
                }

    context = {
        "request": request,
        "settings": settings,
        "current_user": current_user,
        "year": datetime.now().year,
        "timestamp": datetime.now().isoformat()
    }
    return templates.TemplateResponse("spa/index.html", context)

@router.get("/spa/{path:path}", response_class=HTMLResponse)
async def spa_catch_all(request: Request, path: str, db: Session = Depends(get_db)):
    """Все пути SPA ведут на index.html (для клиентской маршрутизации)"""
    return await spa_index(request, db)

# =========== API ДЛЯ SPA ===========

@router.post("/api/v1/auth/login-spa")
async def login_spa(
    username: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False),
    db: Session = Depends(get_db)
):
    """API для входа в SPA (возвращает JSON)"""
    user = authenticate_user(db, username=username, password=password)

    if not user:
        return JSONResponse(
            status_code=401,
            content={"success": False, "detail": "Неверное имя пользователя или пароль"}
        )

    if not user.is_active:
        return JSONResponse(
            status_code=403,
            content={"success": False, "detail": "Учетная запись отключена"}
        )

    # Создаем токен
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES * (24 * 7 if remember else 1)
    )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    # Создаем ответ
    response = JSONResponse({
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active
        }
    })

    # Устанавливаем cookie (для совместимости со старым интерфейсом)
    max_age = access_token_expires.total_seconds() if remember else None
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=max_age,
        secure=not settings.DEBUG,
        samesite="lax"
    )

    return response

@router.get("/api/v1/auth/me")
async def get_current_user_api(
    request: Request,
    db: Session = Depends(get_db)
):
    """Получить информацию о текущем пользователе (для SPA)"""
    # Проверяем токен из cookie или заголовка
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1]

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    username = decode_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active
    }

@router.post("/api/v1/auth/logout")
async def logout_spa():
    """Выход из системы (для SPA)"""
    response = JSONResponse({"success": True})
    response.delete_cookie("access_token")
    return response

# =========== ДОПОЛНИТЕЛЬНЫЕ API ДЛЯ SPA ===========

@router.get("/api/v1/dashboard/stats")
async def get_dashboard_stats(
    request: Request,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user_api)  # Временно отключаем аутентификацию
):
    """Получить статистику для дашборда"""
    agents = get_agents(db, limit=1000)

    online_count = sum(1 for a in agents if a.is_online)
    warning_count = sum(1 for a in agents if getattr(a, 'has_warnings', False))

    return {
        "total_agents": len(agents),
        "online_agents": online_count,
        "offline_agents": len(agents) - online_count,
        "warning_agents": warning_count,
        "recent_agents": [
            {
                "agent_id": a.agent_id,
                "hostname": a.hostname,
                "local_ip": a.local_ip,
                "is_online": a.is_online,
                "last_seen": a.last_seen.isoformat() if a.last_seen else None,
                "platform": a.platform,
                "operating_system": a.operating_system
            }
            for a in agents[:10]
        ]
    }

@router.get("/api/v1/agents/search")
async def search_agents(
    request: Request,
    query: str = Query("", description="Поисковый запрос"),
    status: str = Query("all", description="Фильтр по статусу"),
    platform: str = Query("all", description="Фильтр по платформе"),
    skip: int = Query(0, description="Пропустить записи"),
    limit: int = Query(100, description="Лимит записей"),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user_api)  # Временно отключаем
):
    """Поиск и фильтрация агентов"""
    agents = get_agents(db, skip=skip, limit=limit)

    # Фильтрация
    filtered_agents = []
    for agent in agents:
        # Поиск по тексту
        search_match = (
            query.lower() in agent.agent_id.lower() or
            query.lower() in agent.hostname.lower() or
            (agent.description and query.lower() in agent.description.lower())
        ) if query else True

        # Фильтр по статусу
        status_match = True
        if status == "online":
            status_match = agent.is_online
        elif status == "offline":
            status_match = not agent.is_online

        # Фильтр по платформе
        platform_match = True
        if platform != "all" and agent.platform:
            platform_match = agent.platform.lower() == platform.lower()

        if search_match and status_match and platform_match:
            filtered_agents.append(agent)

    return [
        {
            "id": agent.id,
            "agent_id": agent.agent_id,
            "hostname": agent.hostname,
            "local_ip": agent.local_ip,
            "operating_system": agent.operating_system,
            "platform": agent.platform,
            "cpu_cores": agent.cpu_cores,
            "total_ram": agent.total_ram,
            "is_online": agent.is_online,
            "agent_version": agent.agent_version,
            "created_at": agent.created_at.isoformat() if agent.created_at else None,
            "last_seen": agent.last_seen.isoformat() if agent.last_seen else None,
            "description": agent.description
        }
        for agent in filtered_agents
    ]

# =========== КОРНЕВОЙ ПУТЬ ===========

@router.get("/", response_class=HTMLResponse)
async def root_redirect():
    """Перенаправление с корня на SPA"""
    return RedirectResponse(url="/spa")