import os
from fastapi import FastAPI, Request, Header, HTTPException, Depends, Form
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel
from telegram import Bot
from dotenv import load_dotenv
from loguru import logger
# from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
from datetime import datetime
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
import models, auth



templates = Jinja2Templates(directory="templates")
# Create DB tables (simple approach; use Alembic later)
Base.metadata.create_all(bind=engine)
app = FastAPI()

# В продакшене лучше отдавать статику через nginx, чтобы снять нагрузку с Python.
# app.mount("/static", StaticFiles(directory="static"), name="static")



# Загрузка переменных окружения
# Load .env locally if present (optional)
from dotenv import load_dotenv
if os.path.exists(".env"):
    load_dotenv()

BOT_B_TOKEN = os.getenv("BOT_B_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")
API_KEY = os.getenv("API_KEY")
MAX_MESSAGE_LENGTH = 1000

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
        logger.warning(f"[{timestamp}] ❌ Пустое сообщение. Запрос от IP: {ip}")
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

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/auth")
def authenticate(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
    access = auth.create_access_token(user.username)
    refresh = auth.create_refresh_token(user.username)
    response = RedirectResponse(url="/dashboard", status_code=302)
    # httponly, secure should be enabled in production (secure requires https)
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="lax")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="lax")
    return response

@app.get("/refresh")
def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return RedirectResponse("/login")
    try:
        payload = auth.decode_refresh_token(refresh_token)
        username = payload.get("sub")
        new_access = auth.create_access_token(username)
        resp = RedirectResponse("/dashboard")
        resp.set_cookie("access_token", new_access, httponly=True, secure=True, samesite="lax")
        return resp
    except Exception:
        return RedirectResponse("/login")

@app.get("/logout")
def logout():
    resp = RedirectResponse("/login")
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    return resp

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    username = get_current_username(request)
    if not username:
        return RedirectResponse("/login")
    # Optionally load user from DB (role, etc.)
    user = db.query(models.User).filter(models.User.username == username).first()
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})
