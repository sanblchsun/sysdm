# app/main.py
import asyncio
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from app.api import pages
from app.api import relay
from app.api import web_cookie
from app.middleware.auth_html import AuthHTMLMiddleware
from app.api.agent import router as agent_router

app = FastAPI(title="SysDM RMM")
app.add_middleware(AuthHTMLMiddleware)

# Статика и шаблоны
current_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(current_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")
templates = Jinja2Templates(directory="app/templates")


# Compatibility: rewrite old agent paths to /relay/ prefix.
# НЕ трогаем точный /agents — это HTML-страница (web_cookie.router).
@app.middleware("http")
async def compat_relay_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/relay"):
        if path.startswith("/ingest/"):
            request.scope["path"] = "/relay" + path
        elif path.startswith("/agents/"):
            request.scope["path"] = "/relay" + path
        elif path.startswith("/ws/control/"):
            request.scope["path"] = "/relay" + path
        elif path.startswith("/ws/stream/"):
            request.scope["path"] = "/relay" + path
        elif path.startswith("/stream/mjpeg/"):
            request.scope["path"] = "/relay" + path
        elif path == "/healthz":
            request.scope["path"] = "/relay" + path
    return await call_next(request)


@app.on_event("startup")
async def startup():
    asyncio.create_task(relay._cleanup_dead_agents())


# API
app.include_router(web_cookie.router, tags=["web"])
app.include_router(pages.router)
app.include_router(agent_router)
app.include_router(relay.router)  # /relay/* endpoints


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    return RedirectResponse(url="/login")
