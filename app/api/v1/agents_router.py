# app/api/v1/agents_router.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud.agent import (
    get_agent_by_agent_id,
    create_agent,
    update_agent_heartbeat
)
from app.schemas.agent import AgentCreate, Agent
from app.database import SessionLocal
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
):
    """Регистрирует нового агента или обновляет существующего (публичный эндпоинт)"""
    try:
        print(f"DEBUG: Registering agent: {agent.agent_id}, {agent.hostname}")

        # Проверяем существование агента
        existing = get_agent_by_agent_id(db, agent.agent_id)
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
        db_agent = create_agent(db, agent)
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

@router.post("/{agent_id}/heartbeat", response_model=Agent)
def update_heartbeat(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Обновляет время последней активности агента (публичный эндпоинт)"""
    try:
        agent = update_agent_heartbeat(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except Exception as e:
        print(f"ERROR in heartbeat: {e}")
        raise HTTPException(status_code=500, detail=str(e))