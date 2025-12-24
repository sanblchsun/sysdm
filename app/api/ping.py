from fastapi import APIRouter, Depends
from app.core.auth import get_current_active_user
from app.models.users import User

router = APIRouter()

@router.get('/ping')
async def ping_public():
    """Публичный эндпоинт"""
    return {"ping": "pong"}

@router.get('/ping/secure')
async def ping_secure(
    current_user: User = Depends(get_current_active_user)
):
    """Защищенный эндпоинт"""
    return {
        "ping": "pong",
        "user": current_user.username,
        "message": "Это защищенный эндпоинт"
    }