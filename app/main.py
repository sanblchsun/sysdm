# app/main.py
import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from app.api import pages
from app.api import relay
from fastapi.responses import RedirectResponse
from app.api import web_cookie
from app.middleware.auth_html import AuthHTMLMiddleware
from app.api.agent import router as agent_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(relay.cleanup_stale_agents())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="SysDM RMM", lifespan=lifespan)
app.add_middleware(AuthHTMLMiddleware)

# Статика и шаблоны
current_dir = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(current_dir, "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")
templates = Jinja2Templates(directory="app/templates")


# API
app.include_router(web_cookie.router, tags=["web"])
app.include_router(pages.router)
app.include_router(agent_router)
app.include_router(relay.router)  # /relay/* endpoints
app.include_router(
    relay.compat_router
)  # backward-compatible endpoints (без /relay/ префикса)


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    return RedirectResponse(url="/login")
