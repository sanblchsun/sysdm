from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from app.api import web_cookie
import os
from app.core.authx import auth
from fastapi import FastAPI


app = FastAPI(title="SystemDM API")


# Подключаем статические файлы
current_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(current_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

auth.handle_errors(app)
# Регистрируем роутеры
app.include_router(web_cookie.router, tags=["web"])


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    return RedirectResponse(url="/login")
