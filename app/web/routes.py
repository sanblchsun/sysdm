# app/web/routes.py
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud.user import authenticate_user
from app.utils.security import create_access_token, decode_access_token
from app.config import settings
from app.crud.agent import crud_agent

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

from datetime import datetime, timedelta

# Вспомогательная функция для человекочитаемого времени
def humanize_time(dt):
    """Возвращает человекочитаемое время (например, '2 часа назад')"""
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


# Контекст для всех шаблонов
def get_template_context(request: Request, extra: dict = None):
    context = {
        "request": request,
        "year": datetime.now().year,
        "version": settings.APP_VERSION,
        "current_user": None,
        "humanize_time": humanize_time  # Добавляем функцию
    }

    # Проверяем токен из cookies
    token = request.cookies.get("access_token")
    if token:
        username = decode_access_token(token)
        if username:
            # Здесь можно получить полную информацию о пользователе из БД
            context["current_user"] = {"username": username, "is_admin": True}

    if extra:
        context.update(extra)

    return context

# Страница входа
@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Страница входа"""
    # Если уже авторизован, перенаправляем на dashboard
    token = request.cookies.get("access_token")
    if token and decode_access_token(token):
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

    context = get_template_context(request, {
        "hide_nav": True,
        "hide_footer": True
    })
    return templates.TemplateResponse("login.html", context)

# Обработка входа
@router.post("/login", response_class=HTMLResponse)
async def web_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False),
    db: Session = Depends(get_db)
):

    """Обработка входа через веб-форму"""
    print(f"DEBUG: Web login attempt - username: '{username}', password provided: {bool(password)}")
    """Обработка входа через веб-форму"""
    # Проверяем учетные данные
    user = authenticate_user(db, username=username, password=password)

    if not user:
        print(f"DEBUG: Authentication FAILED for user '{username}'")
        context = get_template_context(request, {
            "hide_nav": True,
            "hide_footer": True,
            "error": "Неверное имя пользователя или пароль",
            "username": username
        })
        return templates.TemplateResponse("login.html", context)

    print(f"DEBUG: User found: {user.username}, is_active: {user.is_active}, is_admin: {user.is_admin}")

    # Проверяем, активен ли пользователь
    if not user.is_active:
        print(f"DEBUG: User '{username}' is not active")
        context = get_template_context(request, {
            "hide_nav": True,
            "hide_footer": True,
            "error": "Учетная запись отключена",
            "username": username
        })
        return templates.TemplateResponse("login.html", context)

    # Создаем JWT токен
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES * (24 * 7 if remember else 1)
    )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    print(f"DEBUG: Token created for '{username}': {access_token[:30]}...")

    # Перенаправляем на dashboard
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

    # Сохраняем токен в cookie
    max_age = access_token_expires.total_seconds() if remember else None
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=max_age,
        secure=False,  # True для production с HTTPS
        samesite="lax"
    )

    # Дополнительная информация о пользователе
    response.set_cookie(
        key="user_info",
        value=f"{user.username}|{user.is_admin}",
        max_age=max_age,
        secure=False,
        samesite="lax"
    )

    print(f"DEBUG: Cookie set, redirecting to /dashboard")

    return response

# Выход из системы
@router.get("/logout")
async def logout():
    """Выход из системы"""
    response = RedirectResponse(url="/login")
    response.delete_cookie("access_token")
    response.delete_cookie("user_info")
    return response

# Middleware для проверки аутентификации
async def require_auth(request: Request, call_next):
    """Промежуточное ПО для проверки аутентификации"""
    # Пути, которые не требуют аутентификации
    public_paths = [
        "/login",
        "/static",
        "/api/v1/auth/login",
        "/api/v1/auth/login-basic",
        "/health"
    ]

    # Проверяем, является ли путь публичным
    if any(request.url.path.startswith(path) for path in public_paths):
        return await call_next(request)

    # Проверяем токен в cookie
    token = request.cookies.get("access_token")
    if token:
        username = decode_access_token(token)
        if username:
            # Токен валиден, добавляем пользователя в состояние запроса
            request.state.user = username
            return await call_next(request)

    # Если нет валидного токена, перенаправляем на страницу входа
    if request.url.path.startswith("/api/"):
        # Для API возвращаем 401
        raise HTTPException(status_code=401, detail="Not authenticated")
    else:
        # Для веб-интерфейса перенаправляем на страницу входа
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

# Дашборд (требует аутентификации)
@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    """Дашборд системы"""
    # Получаем статистику
    agents = crud_agent.get_agents(db, limit=100)
    online_agents = [a for a in agents if a.is_online]
    offline_agents = [a for a in agents if not a.is_online]

    # Статистика по операционным системам
    os_stats = []
    os_counts = {}

    # Собираем статистику по ОС
    for agent in agents:
        if agent.platform:
            platform = agent.platform.lower()
            if 'windows' in platform:
                os_name = 'Windows'
            elif 'linux' in platform:
                os_name = 'Linux'
            elif 'mac' in platform or 'darwin' in platform:
                os_name = 'macOS'
            elif 'freebsd' in platform:
                os_name = 'FreeBSD'
            else:
                os_name = platform.capitalize()
        elif agent.operating_system:
            # Пытаемся определить по названию ОС
            os_lower = agent.operating_system.lower()
            if 'windows' in os_lower:
                os_name = 'Windows'
            elif 'linux' in os_lower or 'ubuntu' in os_lower or 'centos' in os_lower or 'debian' in os_lower:
                os_name = 'Linux'
            elif 'mac' in os_lower or 'darwin' in os_lower:
                os_name = 'macOS'
            else:
                os_name = 'Другое'
        else:
            os_name = 'Неизвестно'

        os_counts[os_name] = os_counts.get(os_name, 0) + 1

    # Цвета для графиков
    os_colors = {
        'Windows': '#007bff',      # синий
        'Linux': '#28a745',        # зеленый
        'macOS': '#6f42c1',        # фиолетовый
        'FreeBSD': '#fd7e14',      # оранжевый
        'Другое': '#6c757d',       # серый
        'Неизвестно': '#6c757d'    # серый
    }

    # Формируем статистику для отображения
    for os_name, count in sorted(os_counts.items(), key=lambda x: x[1], reverse=True):
        if os_name not in ['Другое', 'Неизвестно']:
            percentage = round((count / len(agents) * 100), 1) if agents else 0
            os_stats.append({
                'name': os_name,
                'count': count,
                'percentage': percentage,
                'color': os_colors.get(os_name, '#6c757d')
            })

    # Группируем "Другое" и "Неизвестно"
    unknown_os_count = os_counts.get('Другое', 0) + os_counts.get('Неизвестно', 0)
    unknown_os_percentage = round((unknown_os_count / len(agents) * 100), 1) if agents else 0

    context = get_template_context(request, {
        "page_title": "Дашборд",
        "total_agents": len(agents),
        "online_agents": len(online_agents),
        "offline_agents": len(offline_agents),
        "recent_agents": agents[:5],
        "current_time": datetime.now().strftime('%H:%M:%S'),
        "os_stats": os_stats,
        "unknown_os_count": unknown_os_count,
        "unknown_os_percentage": unknown_os_percentage,
        "os_data_json": json.dumps({
            'labels': [os['name'] for os in os_stats] + (['Другое/Неизвестно'] if unknown_os_count > 0 else []),
            'data': [os['count'] for os in os_stats] + ([unknown_os_count] if unknown_os_count > 0 else []),
            'colors': [os['color'] for os in os_stats] + (['#6c757d'] if unknown_os_count > 0 else [])
        })
    })
    return templates.TemplateResponse("dashboard.html", context)

# Список агентов (требует аутентификации)
@router.get("/agents", response_class=HTMLResponse)
async def web_agents_list(request: Request, db: Session = Depends(get_db)):
    """Страница со списком агентов"""
    agents = crud_agent.get_agents(db, limit=100)

    context = get_template_context(request, {
        "page_title": "Агенты",
        "agents": agents
    })
    return templates.TemplateResponse("agents/list.html", context)

# Детальная информация об агенте
@router.get("/agents/{agent_id}", response_class=HTMLResponse)
async def agent_detail_page(request: Request, agent_id: str, db: Session = Depends(get_db)):
    """Страница с детальной информацией об агенте"""
    agent = crud_agent.get_agent(db, agent_id)
    if not agent:
        # Если агент не найден, показываем 404 страницу
        context = get_template_context(request, {
            "page_title": "Агент не найден",
            "error_message": f"Агент с ID '{agent_id}' не найден"
        })
        return templates.TemplateResponse("errors/404.html", context)

    context = get_template_context(request, {
        "page_title": f"Агент: {agent.hostname}",
        "agent": agent
    })
    return templates.TemplateResponse("agents/detail.html", context)

# Корневой путь
@router.get("/", response_class=HTMLResponse)
async def root_redirect():
    """Перенаправление с корня на логин или dashboard"""
    return RedirectResponse(url="/login")