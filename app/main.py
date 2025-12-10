# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Настраиваем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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