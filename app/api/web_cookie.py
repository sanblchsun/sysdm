from fastapi import APIRouter, Request, Form, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pathlib import Path
from app.config import settings
from app.database import get_session
from app.models.users import User
from app.core.authx import auth, auth_config
from loguru import logger


BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")

router = APIRouter()


# -------------------- LOGIN --------------------
@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse(
        "login_nojs.html", {"request": request, "error": None}
    )


@router.post("/login")
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
    try:
        access_token = auth.create_access_token(username)
        refresh_token = auth.create_refresh_token(username)

        if "cookies" in auth_config.JWT_TOKEN_LOCATION:
            response = RedirectResponse(url="/agents", status_code=302)
            auth.set_access_cookies(access_token, response)
            auth.set_refresh_cookies(refresh_token, response)

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/logout")
async def logout(response: Response):
    """Logout endpoint that clears the cookies."""
    auth.unset_cookies(response)
    return {"message": "Successfully logged out"}


# -------------------- AGENTS (защищённый) --------------------
@router.get("/agents")
async def protected_route(request: Request):
    """Protected route that requires a valid access token from any location."""
    try:
        # get and verify the token from the request
        token = await auth.get_access_token_from_request(request)
        payload = auth.verify_token(token, verify_csrf=False)

    except Exception as e:
        return RedirectResponse(url="/login", status_code=401)

    return templates.TemplateResponse(
        "agents.html",
        {"request": request, "user": payload.sub, "agents": "agents_data"},
    )
