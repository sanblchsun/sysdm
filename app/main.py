from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from app.api import auth, web_cookie
import os

app = FastAPI(title="SystemDM API")

# Подключаем статические файлы
current_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(current_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Регистрируем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(web_cookie.router, tags=["web"])


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    logger.debug(
        """ 
                 @app.get("/")
                 """
    )
    return RedirectResponse(url="/login")
