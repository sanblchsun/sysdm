# app/api/v1/agents.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.schemas.agent import AgentCreate, AgentResponse, AgentUpdate
from app.crud.agent import crud_agent
from app.config import settings

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/register", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def register_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового агента или обновление существующего.
    """
    try:
        agent = crud_agent.create_agent(db, agent_data)
        return agent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка регистрации агента: {str(e)}"
        )


@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список всех зарегистрированных агентов"""
    agents = crud_agent.get_agents(db, skip=skip, limit=limit)
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Получить информацию об агенте по его ID"""
    agent = crud_agent.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Агент с ID '{agent_id}' не найден"
        )
    return agent


@router.put("/{agent_id}/heartbeat")
async def agent_heartbeat(agent_id: str, db: Session = Depends(get_db)):
    """Обновить время последней активности агента"""
    agent = crud_agent.update_heartbeat(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Агент с ID '{agent_id}' не найден"
        )

    return {
        "status": "success",
        "agent_id": agent_id,
        "last_seen": agent.last_seen.isoformat() if agent.last_seen else None,
        "message": "Heartbeat обновлен"
    }


@router.get("/{agent_id}/status")
async def get_agent_status(agent_id: str, db: Session = Depends(get_db)):
    """Получить статус агента (online/offline)"""
    agent = crud_agent.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Агент с ID '{agent_id}' не найден"
        )

    if not agent.last_seen:
        # Если never seen, считаем offline
        is_online = False
        time_diff = None
    else:
        # Используем datetime.now() - локальное время сервера
        now = datetime.now()

        # Убираем timezone из last_seen если он есть
        last_seen_naive = agent.last_seen.replace(tzinfo=None) if agent.last_seen.tzinfo else agent.last_seen

        # Вычисляем разницу
        time_diff = (now - last_seen_naive).total_seconds()

        # Проверяем timeout
        is_online = agent.is_online and time_diff < settings.AGENT_TIMEOUT

    return {
        "agent_id": agent_id,
        "hostname": agent.hostname,
        "is_online": is_online,
        "last_seen": agent.last_seen.isoformat() if agent.last_seen else None,
        "time_since_last_seen_seconds": round(time_diff, 2) if time_diff is not None else None,
        "timeout_seconds": settings.AGENT_TIMEOUT,
        "status": "online" if is_online else "offline"
    }