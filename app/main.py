import os
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
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
from fastapi.responses import HTMLResponse

templates = Jinja2Templates(directory="templates")
app = FastAPI()

# В продакшене лучше отдавать статику через nginx, чтобы снять нагрузку с Python.
# app.mount("/static", StaticFiles(directory="static"), name="static")



# Загрузка переменных окружения
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

@app.get("/")
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

# Главная страница / Dashboard 
@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    # Здесь будет обращение к backend TacticalRMM API
    stats = {"total_agents": 0}
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "stats": stats}
    )


# Список агентов 
@app.get("/agents", response_class=HTMLResponse)
async def agents_page(request: Request):
    agents = []  # <- сюда позже подтянем API TacticalRMM
    return templates.TemplateResponse(
        "agents.html",
        {"request": request, "agents": agents}
    )


#  Страница агента
@app.get("/agents/{agent_id}", response_class=HTMLResponse)
async def agent_details(request: Request, agent_id: str):
    agent = {
        "id": agent_id,
        "hostname": "example-host",
        "platform": "linux",
        "cpu_count": 4,
        "memory_total": 8192,
    }
    return templates.TemplateResponse(
        "agent.html",
        {"request": request, "agent": agent, "result": None}
    )


# Login
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

