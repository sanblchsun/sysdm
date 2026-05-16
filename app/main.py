# app/main.py
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api import pages
from app.api import relay
from app.api import web_cookie
from app.middleware.auth_html import AuthHTMLMiddleware
from app.api.agent import router as agent_router
from app.config import settings
from app.redis_client import get_redis
from app.database import get_db


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("[app] Starting SysDM application")
    asyncio.create_task(relay._cleanup_dead_agents())
    await relay.PS_MANAGER.start()
    logger.info("[app] Application started")
    
    yield
    
    # Shutdown
    logger.info("[app] Shutting down SysDM application")
    await relay.PS_MANAGER.stop()
    from app.redis_client import close_redis
    await close_redis()
    logger.info("[app] Application stopped")


app = FastAPI(
    title="SysDM RMM",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# Add rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return {"detail": "Rate limit exceeded"}, 429

# Set state for rate limiter
app.state.limiter = limiter

app.add_middleware(AuthHTMLMiddleware)

# Add CORS middleware
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Статика и шаблоны
current_dir = Path(__file__).parent
static_path = current_dir / "static"
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
    return await call_next(request)


# Health check endpoint for Docker and monitoring
@app.get("/healthz")
async def healthz():
    """Health check endpoint - verify all critical services are operational"""
    redis_status = "unknown"
    db_status = "unknown"
    
    try:
        # Check Redis connection
        r = await get_redis()
        await r.ping()
        redis_status = "ok"
    except Exception as e:
        redis_status = f"error: {str(e)}"
        raise HTTPException(status_code=503, detail=f"Redis unavailable: {e}")
    
    try:
        # Check Database connection
        async for session in get_db():
            from sqlalchemy import select, text
            await session.execute(select(text("1")))
            db_status = "ok"
            break  # Exit loop after successful check
    except Exception as e:
        db_status = f"error: {str(e)}"
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "database": db_status,
    }


# API
app.include_router(web_cookie.router, tags=["web"])
app.include_router(pages.router)
app.include_router(agent_router)
app.include_router(relay.router)  # /relay/* endpoints


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    return RedirectResponse(url="/login")
