from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.token_validation import TokenValidationMiddleware
from app.api import ping, auth, agents, web_cookie
import os

app = FastAPI(title="SystemDM API")

# Подключаем статические файлы
current_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(current_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Token validation middleware
app.add_middleware(TokenValidationMiddleware)

# Регистрируем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(agents.router, tags=["agents"])
app.include_router(web_cookie.router, tags=["web"])
app.include_router(ping.router, tags=["ping"])


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    return RedirectResponse(url="/login")
