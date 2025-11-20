from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.database import SessionLocal
from fastapi.templating import Jinja2Templates
from app import crud, auth
from fastapi import APIRouter, Request, Depends, Form

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.get("/login")
def login_page():
    return {"message": "login page"}

@router.post("/login")
def login():
    return {"message": "user logged in"}

@router.get("/logout")
def logout():
    return {"message": "logout"}

templates = Jinja2Templates(directory="app/templates")
#
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
#
# @router.get("/login", response_class=HTMLResponse)
# def login_get(request: Request):
#     return templates.TemplateResponse("login.html", {"request": request})
#
# @router.post("/auth")
# def login_post(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
#     user = crud.get_user_by_username(db, username)
#     if not user or not auth.verify_password(password, user.hashed_password):
#         return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
#     access = auth.create_access_token(user.username)
#     refresh = auth.create_refresh_token(user.username)
#     resp = RedirectResponse(url="/dashboard", status_code=302)
#     # secure=True requires HTTPS; set False for local testing if needed
#     resp.set_cookie("access_token", access, httponly=True, secure=True, samesite="lax")
#     resp.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="lax")
#     return resp
#
# @router.get("/logout")
# def logout():
#     resp = RedirectResponse("/login")
#     resp.delete_cookie("access_token")
#     resp.delete_cookie("refresh_token")
#     return resp
