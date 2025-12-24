from fastapi import APIRouter, Depends
from app.core.auth import get_current_active_user
from app.models.users import User

router = APIRouter()


@router.get("api/agents")
async def get_agents(current_user: User = Depends(get_current_active_user)):
    """Получить список агентов (требует авторизации)"""
    # TODO: Замените на реальную логику из вашего проекта
    return [
        {
            "id": 1,
            "name": "Агент 001",
            "status": "Активен",
            "last_seen": "2024-01-15 14:30:00",
        },
        {
            "id": 2,
            "name": "Агент 002",
            "status": "Неактивен",
            "last_seen": "2024-01-14 10:15:00",
        },
        {
            "id": 3,
            "name": "Агент 003",
            "status": "Активен",
            "last_seen": "2024-01-15 09:45:00",
        },
    ]
