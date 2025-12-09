# app/routers/agents_router.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud.agent import crud_agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.database import SessionLocal
from app.routers.auth_router import get_current_active_user, get_current_admin_user
import traceback

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========== ПУБЛИЧНЫЕ ЭНДПОИНТЫ (без аутентификации) ===========

@router.post("/register", status_code=201)
def register_agent(
    agent: AgentCreate,
    db: Session = Depends(get_db)
    # УБРАЛИ аутентификацию! Агенты не могут логиниться как пользователи
):
    """Регистрирует нового агента или обновляет существующего (публичный эндпоинт)"""
    try:
        print(f"DEBUG: Registering agent: {agent.agent_id}, {agent.hostname}")

        # Проверяем существование агента
        existing = crud_agent.get_agent(db, agent.agent_id)
        if existing:
            # Обновляем существующего агента
            print(f"DEBUG: Updating existing agent: {agent.agent_id}")
            update_data = agent.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            existing.is_online = True
            db.add(existing)
            db.commit()
            db.refresh(existing)
            return {
                "id": existing.id,
                "agent_id": existing.agent_id,
                "hostname": existing.hostname,
                "local_ip": existing.local_ip,
                "is_online": existing.is_online,
                "agent_version": existing.agent_version,
                "created_at": existing.created_at.isoformat() if existing.created_at else None,
                "message": "Agent updated"
            }

        # Создаем нового агента
        print(f"DEBUG: Creating new agent: {agent.agent_id}")
        db_agent = crud_agent.create_agent(db, agent)
        if db_agent:
            return {
                "id": db_agent.id,
                "agent_id": db_agent.agent_id,
                "hostname": db_agent.hostname,
                "local_ip": db_agent.local_ip,
                "is_online": db_agent.is_online,
                "agent_version": db_agent.agent_version,
                "created_at": db_agent.created_at.isoformat() if db_agent.created_at else None,
                "message": "Agent created"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create agent")

    except Exception as e:
        print(f"ERROR in register_agent: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{agent_id}/heartbeat", response_model=AgentResponse)
def update_heartbeat(
    agent_id: str,
    db: Session = Depends(get_db)
    # Тоже публичный эндпоинт!
):
    """Обновляет время последней активности агента (публичный эндпоинт)"""
    try:
        agent = crud_agent.update_heartbeat(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except Exception as e:
        print(f"ERROR in heartbeat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =========== ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ (требуют аутентификации) ===========

@router.get("/", response_model=List[AgentResponse])
def list_agents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Аутентификация ТРЕБУЕТСЯ
):
    """Получает список агентов (требуется аутентификация)"""
    return crud_agent.get_agents(db, skip=skip, limit=limit)


@router.get("/{agent_id}", response_model=AgentResponse)
def agent_detail(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Аутентификация ТРЕБУЕТСЯ
):
    """Получает информацию об агенте по его ID (требуется аутентификация)"""
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
    """Обновляет информацию об агенте (требуется админ)"""
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
    """Удаляет агента (требуется админ)"""
    result = crud_agent.delete_agent(db, agent_id)
    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.get("/offline/timeout/{timeout_minutes}", response_model=List[AgentResponse])
def get_offline_agents(
    timeout_minutes: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)  # Аутентификация ТРЕБУЕТСЯ
):
    """Получает список оффлайн агентов (требуется аутентификация)"""
    return crud_agent.get_offline_agents(db, timeout_minutes)