# app/main.py
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.api.v1 import agents as agents_api
from app.web import routes as web_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    print(f"🚀 Запуск SysDM v{settings.APP_VERSION}")

    # Создаем таблицы в режиме отладки
    if settings.DEBUG:
        Base.metadata.create_all(bind=engine)

    yield

    print("👋 Завершение работы SysDM")

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Инициализируем templates ДО использования
templates = Jinja2Templates(directory="app/templates")

# Подключаем статические файлы
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем API эндпоинты
app.include_router(agents_api.router, prefix="/api/v1")

# Подключаем Web роуты
app.include_router(web_routes.router)

# Глобальные обработчики ошибок
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Кастомная страница 404"""
    return templates.TemplateResponse("errors/404.html", {
        "request": request,
        "title": "Страница не найдена"
    }, status_code=404)

# Корневой редирект на дашборд
@app.get("/")
async def root():
    """Редирект с корня на дашборд"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse("/dashboard")

# Здоровье приложения
@app.get("/health")
async def health():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Информация о приложении
@app.get("/info")
async def info():
    return {
        "app": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG
    }