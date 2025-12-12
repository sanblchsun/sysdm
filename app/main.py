# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from app.config import settings
from app.database import engine, Base
from app.api.v1 import agents_router, auth_router
from app.web.routes import router as web_router

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Создаем таблицы
Base.metadata.create_all(bind=engine)

# ⚠️ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем root_path для работы за прокси
# Это говорит FastAPI, что он находится за reverse proxy (Nginx)
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    # ⭐⭐⭐ ДОБАВЛЯЕМ ЭТО ⭐⭐⭐
    root_path=""
)

# ⭐⭐⭐ ДОБАВЛЯЕМ: Middleware для доверенных хостов
# Это позволяет FastAPI принимать заголовки X-Forwarded-* от Nginx
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Для продакшена укажите конкретные домены
)

# Настраиваем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⭐⭐⭐ ДОБАВЛЯЕМ: Middleware для коррекции URL схемы
# Этот middleware исправляет схему (http/https) на основе заголовков от Nginx
@app.middleware("http")
async def correct_scheme_from_proxy_headers(request: Request, call_next):
    # Если Nginx сообщил, что оригинальный запрос был по HTTPS, исправляем схему
    if request.headers.get("x-forwarded-proto") == "https":
        # Меняем схему в объекте request
        request.scope["scheme"] = "https"
    
    response = await call_next(request)
    return response

# Подключаем статические файлы
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Подключаем роутеры API
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(agents_router, prefix="/api/v1/agents", tags=["agents"])

# Подключаем веб-роутер
app.include_router(web_router)

@app.get("/")
async def root():
    """Корневой путь - редирект на SPA"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/spa")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
