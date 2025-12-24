from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ping, auth, web_cookie, agents
from app.config import settings
from fastapi.staticfiles import StaticFiles
from app.middleware.token_validation import AutoRenewalMiddleware

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
)

# Настройка CORS
if settings.CORS_ORIGINS:
    origins = settings.CORS_ORIGINS.split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Регистрируем middleware
app.add_middleware(AutoRenewalMiddleware)
app.include_router(agents.router)  # /agents
app.include_router(auth.router, prefix="/auth")  # /auth/*
app.include_router(ping.router)  # /ping
app.include_router(web_cookie.router)  # /login, /agents-page


# Корневой путь перенаправляет на логин
@app.get("/")
async def root():
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url="/login")
