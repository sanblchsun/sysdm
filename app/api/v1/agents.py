# app/api/v1/agents.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.schemas.agent import AgentCreate, AgentResponse, AgentUpdate
from app.crud.agent import crud_agent
from app.config import settings

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/register", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def register_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового агента или обновление существующего.

    Если агент с таким agent_id или hostname уже существует,
    его данные будут обновлены.
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
        "last_seen": agent.last_seen.isoformat(),
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

    # Проверяем, не устарел ли статус
    from datetime import timedelta
    timeout_threshold = datetime.utcnow() - timedelta(seconds=settings.AGENT_TIMEOUT)

    is_actually_online = (
        agent.is_online and
        agent.last_seen and
        agent.last_seen > timeout_threshold
    )

    return {
        "agent_id": agent_id,
        "hostname": agent.hostname,
        "is_online": is_actually_online,
        "last_seen": agent.last_seen.isoformat() if agent.last_seen else None,
        "agent_version": agent.agent_version
    }