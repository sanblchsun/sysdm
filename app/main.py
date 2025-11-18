import os
from fastapi import FastAPI, Request, Header, HTTPException, Depends, Form
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel
from telegram import Bot
from environs import Env
from loguru import logger
# from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
from datetime import datetime
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from routers import auth_router, agents_router


templates = Jinja2Templates(directory="templates")
# Create DB tables (simple approach; use Alembic later)
app = FastAPI()
# include routers
app.include_router(auth_router.router)
app.include_router(agents_router.router)
# В продакшене лучше отдавать статику через nginx, чтобы снять нагрузку с Python.
# app.mount("/static", StaticFiles(directory="static"), name="static")



# Загрузка переменных окружения
# Load .env locally if present (optional)
env = Env()
env.read_env()

BOT_B_TOKEN = env.str("BOT_B_TOKEN")
CHAT_ID = env.str("CHAT_ID")
API_KEY = env.str("API_KEY")
MAX_MESSAGE_LENGTH = 1000

logger.info("===== LOADED ENVIRONMENT VARIABLES =====")
logger.info(f"DATABASE_URL={env.str('DATABASE_URL')}")
logger.info(f"DB_HOST={env.str('DB_HOST')}")
logger.info(f"DB_PORT={env.str('DB_PORT')}")
logger.info(f"POSTGRES_USER={env.str('POSTGRES_USER')}")
logger.info(f"POSTGRES_PASSWORD={'****' if env.str('POSTGRES_PASSWORD') else None}")
logger.info(f"POSTGRES_DB={env.str('POSTGRES_DB')}")
logger.info(f"SECRET_KEY={'****' if env.str('SECRET_KEY') else None}")
logger.info(f"REFRESH_SECRET_KEY={'****' if env.str('REFRESH_SECRET_KEY') else None}")
logger.info(f"ACCESS_TOKEN_EXPIRE_MINUTES={env.str('ACCESS_TOKEN_EXPIRE_MINUTES')}")
logger.info(f"REFRESH_TOKEN_EXPIRE_DAYS={env.str('REFRESH_TOKEN_EXPIRE_DAYS')}")
logger.info("======================================")



if not BOT_B_TOKEN or not CHAT_ID or not API_KEY:
    raise EnvironmentError("BOT_B_TOKEN, CHAT_ID или API_KEY отсутствуют в .env")

bot = Bot(token=BOT_B_TOKEN)

# Лимит на IP (или кастомный ключ)
# limiter = Limiter(key_func=lambda request: request.headers.get("X-API-Key", "anonymous"))
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Логирование
logger.add("logs/bot.log", rotation="1 day", retention="7 days", level="INFO")


# Модель запроса
class MessageRequest(BaseModel):
    message: str


# --- DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Helper: get current user from access cookie
def get_current_username(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        from . import auth
        payload = auth.decode_access_token(token)
        return payload.get("sub")
    except Exception:
        return None


# --- Routes
@app.get("/test")
def read_root():
    return {"message": "Hello from FastAPI!"}


@app.post("/send")
# @limiter.limit("60/minute")
async def receive_message(
    payload: MessageRequest,
    request: Request,
    x_api_key: str = Header(...)
):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    # print(f"Получен ключ: {x_api_key}")
    # print(f"Ожидаемый ключ: {API_KEY}")
    # print("Заголовки запроса:")
    # print(dict(request.headers))
    if x_api_key != API_KEY:
        logger.warning(f"[{timestamp}] ❌ Отклонённый запрос — Неверный API ключ")
        raise HTTPException(status_code=401, detail="Unauthorized")

    message = payload.message.strip()
    if not message:
        logger.warning(f"[{timestamp}] ❌ Пустое сообщение. Запрос от IP:")
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(message) > MAX_MESSAGE_LENGTH:
        logger.warning(f"[{timestamp}] ❌ Превышена длина сообщения: ({len(message)} символов)")
        raise HTTPException(
            status_code=400,
            detail=f"Message too long (max {MAX_MESSAGE_LENGTH} characters)"
        )
    if message != "support services":
        try:
            await bot.send_message(
                chat_id=CHAT_ID,
                text=message,
                parse_mode="HTML"
            )
            ip = get_remote_address(request)
            logger.info(f"[{timestamp}] ✅ Сообщение отправлено: '{message}'. Запрос от IP: {ip}")
            return JSONResponse(content={"status": "ok"}, status_code=200)
        except Exception as e:
            logger.error(f"[{timestamp}] ❌ Ошибка при отправке: {str(e)}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
    else:
        print(message)
        return JSONResponse(content={"status": message}, status_code=200)

# страницы интерфейса (как у TacticalRMM)
@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    user = get_current_username(request)
    return templates.TemplateResponse("index.html", {"request": request, "user": user})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db = Depends(get_db)):
    username = get_current_username(request)
    if not username:
        return RedirectResponse("/login")
    user = db.query(models.User).filter(models.User.username == username).first()
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})
