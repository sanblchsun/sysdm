# app/crud/agent.py
from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate
from typing import Optional, List
from datetime import datetime


class CRUDAgent:
    @staticmethod
    def get_agent(db: Session, agent_id: str) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.agent_id == agent_id).first()

    @staticmethod
    def get_agents(db: Session, skip: int = 0, limit: int = 100) -> List[Agent]:
        return db.query(Agent).order_by(Agent.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_agent(db: Session, agent_data: AgentCreate) -> Agent:
        # Проверяем существование агента
        existing_agent = db.query(Agent).filter(
            (Agent.agent_id == agent_data.agent_id) |
            (Agent.hostname == agent_data.hostname)
        ).first()

        if existing_agent:
            # Обновляем существующего агента
            for field, value in agent_data.dict(exclude_unset=True).items():
                setattr(existing_agent, field, value)
            existing_agent.is_online = True
            existing_agent.last_seen = datetime.utcnow()
            db.commit()
            db.refresh(existing_agent)
            return existing_agent

        # Создаем нового агента
        db_agent = Agent(
            **agent_data.dict(),
            is_online=True,
            last_seen=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
        return db_agent

    @staticmethod
    def update_agent(db: Session, agent_id: str, agent_data: AgentUpdate) -> Optional[Agent]:
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            return None

        for field, value in agent_data.dict(exclude_unset=True).items():
            setattr(agent, field, value)

        agent.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def delete_agent(db: Session, agent_id: str) -> bool:
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            return False

        db.delete(agent)
        db.commit()
        return True

    @staticmethod
    def update_heartbeat(db: Session, agent_id: str) -> Optional[Agent]:
        """Обновляет время последней активности агента"""
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            return None

        agent.is_online = True
        agent.last_seen = datetime.utcnow()
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def get_offline_agents(db: Session, timeout_minutes: int) -> List[Agent]:
        """Получает агентов, которые не выходили на связь дольше timeout_minutes"""
        from datetime import timedelta

        timeout_threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        return db.query(Agent).filter(
            Agent.is_online == True,
            Agent.last_seen < timeout_threshold
        ).all()


crud_agent = CRUDAgent()