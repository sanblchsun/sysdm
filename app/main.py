from fastapi import FastAPI, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
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


# Глобальный обработчик 401 ошибок
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Перехватывает 401 ошибки и делает редирект на /login для HTML запросов.
    """
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        # Определяем, является ли запрос API запросом
        path = request.url.path
        is_api_request = path.startswith("/api/") and not path.startswith("/api/auth")

        # Если это не API запрос - делаем редирект на логин
        if not is_api_request:
            response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
            # Очищаем невалидный токен
            response.delete_cookie(key="access_token")
            return response

    # Для API запросов или других ошибок возвращаем JSON
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Регистрируем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(agents.router, tags=["agents"])
app.include_router(web_cookie.router, tags=["web"])
app.include_router(ping.router, tags=["ping"])


# Корневой путь перенаправляет на логин - ВОССТАНАВЛИВАЕМ ВАШ КОД
@app.get("/")
async def root():
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url="/login")
