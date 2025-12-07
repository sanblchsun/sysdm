from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud.agent import crud_agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.database import SessionLocal
from app.routers.auth_router import get_current_active_user, get_current_admin_user  # Добавляем импорт!
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[AgentResponse])
def list_agents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Добавляем аутентификацию
):
    """Получает список агентов"""
    return crud_agent.get_agents(db, skip=skip, limit=limit)


@router.post("/register", response_model=AgentResponse)
def register_agent(
    agent: AgentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Добавляем аутентификацию
):
    """Регистрирует нового агента или обновляет существующего"""
    # Проверяем существование агента
    existing = crud_agent.get_agent(db, agent.agent_id)
    if existing:
        # Обновляем существующего агента
        update_data = agent.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        existing.is_online = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    # Создаем нового агента
    return crud_agent.create_agent(db, agent)


@router.get("/{agent_id}", response_model=AgentResponse)
def agent_detail(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Добавляем аутентификацию
):
    """Получает информацию об агенте по его ID"""
    agent = crud_agent.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Только для администраторов
):
    """Обновляет информацию об агенте"""
    agent = crud_agent.update_agent(db, agent_id, agent_data)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Только для администраторов
):
    """Удаляет агента"""
    result = crud_agent.delete_agent(db, agent_id)
    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.post("/{agent_id}/heartbeat", response_model=AgentResponse)
def update_heartbeat(
    agent_id: str,
    db: Session = Depends(get_db)
    # Без аутентификации, чтобы агенты могли отправлять heartbeat
):
    """Обновляет время последней активности агента"""
    agent = crud_agent.update_heartbeat(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/offline/timeout/{timeout_minutes}", response_model=List[AgentResponse])
def get_offline_agents(
    timeout_minutes: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Добавляем аутентификацию
):
    """Получает список агентов, которые не выходили на связь дольше указанного времени"""
    return crud_agent.get_offline_agents(db, timeout_minutes)