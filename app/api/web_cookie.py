from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pathlib import Path
from app.config import settings
from app.database import get_session
from app.models.users import User
from app.core.authx import get_auth
from loguru import logger
from authx import RequestToken


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")

router = APIRouter()


@router.get("/login")
async def login_page(request: Request):
    """Страница входа"""
    logger.debug(
        """
                 @router.get("/login",
                 """
    )
    return templates.TemplateResponse(
        "login_nojs.html", {"request": request, "error": None}
    )


# -------------------- LOGIN --------------------
@router.post("/login", response_class=HTMLResponse)
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(select(User).where(User.username == username))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.verify_password(password):
        return templates.TemplateResponse(
            "login_nojs.html",
            {"request": request, "error": "Неверный логин или пароль"},
            status_code=401,
        )

    if not user.is_active:
        return templates.TemplateResponse(
            "login_nojs.html",
            {"request": request, "error": "Пользователь отключён"},
            status_code=403,
        )

    # Создаём JWT access token
    username = str(user.username)
    logger.debug(
        f"""
                 Пользователь получил uid: {username}"""
    )
    access_token = get_auth.create_access_token(uid=username)

    # Ответ с редиректом на /agents
    response = RedirectResponse(url="/agents", status_code=302)
    get_auth.set_access_cookies(access_token, response)
    return response


# -------------------- AGENTS (защищённый) --------------------
@router.get("/agents", dependencies=[Depends(get_auth.get_token_from_request)])
def get_protected(token: RequestToken = Depends()):
    try:
        get_auth.verify_token(token=token)
        return {"message": "Hello world !"}
    except Exception as e:
        raise HTTPException(401, detail={"message": str(e)}) from e
