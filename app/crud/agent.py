# app/crud/agent.py
from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json


class CRUDAgent:
    @staticmethod
    def get_agent(db: Session, agent_id: str) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.agent_id == agent_id).first()

    @staticmethod
    def get_agents(db: Session, skip: int = 0, limit: int = 100) -> List[Agent]:
        return db.query(Agent).order_by(Agent.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def _prepare_agent_data(agent_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Подготавливает данные агента для сохранения в БД"""
        # Обрабатываем disk_space - конвертируем в JSON или устанавливаем None
        disk_space = agent_dict.get('disk_space')
        if disk_space is None or disk_space == 'null' or disk_space == '':
            disk_space = None
        elif isinstance(disk_space, dict):
            # Убедимся, что это валидный JSON
            try:
                # Просто оставляем как dict, SQLAlchemy/PostgreSQL обработает
                pass
            except Exception:
                disk_space = None

        # Подготавливаем словарь для модели
        model_data = {
            'agent_id': agent_dict.get('agent_id'),
            'hostname': agent_dict.get('hostname'),
            'local_ip': agent_dict.get('local_ip'),
            'public_ip': agent_dict.get('public_ip'),
            'mac_address': agent_dict.get('mac_address'),
            'operating_system': agent_dict.get('operating_system'),
            'platform': agent_dict.get('platform'),
            'architecture': agent_dict.get('architecture'),
            'cpu_model': agent_dict.get('cpu_model'),
            'cpu_cores': agent_dict.get('cpu_cores'),
            'total_ram': agent_dict.get('total_ram'),
            'disk_space': disk_space,
            'site_id': agent_dict.get('site_id'),
            'department': agent_dict.get('department'),
            'description': agent_dict.get('description'),
        }

        # Убираем None значения, которые не должны быть в словаре для **kwargs
        # Но для модели Agent лучше оставить явные None
        return model_data

    @staticmethod
    def create_agent(db: Session, agent_data: AgentCreate) -> Agent:
        # Проверяем существование агента
        existing_agent = db.query(Agent).filter(
            (Agent.agent_id == agent_data.agent_id) |
            (Agent.hostname == agent_data.hostname)
        ).first()

        if existing_agent:
            # Обновляем существующего агента
            update_data = agent_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing_agent, field, value)
            existing_agent.is_online = True
            existing_agent.last_seen = datetime.now()
            db.commit()
            db.refresh(existing_agent)
            return existing_agent

        # Создаем нового агента
        db_agent = Agent(
            agent_id=agent_data.agent_id,
            hostname=agent_data.hostname,
            local_ip=agent_data.local_ip,
            public_ip=agent_data.public_ip,
            mac_address=agent_data.mac_address,
            operating_system=agent_data.operating_system,
            platform=agent_data.platform,
            architecture=agent_data.architecture,
            cpu_model=agent_data.cpu_model,
            cpu_cores=agent_data.cpu_cores,
            total_ram=agent_data.total_ram,
            disk_space=agent_data.disk_space or {},
            site_id=agent_data.site_id,
            department=agent_data.department,
            description=agent_data.description,
            is_online=True,
            last_seen=datetime.now(),
            created_at=datetime.now(),
            agent_version="1.0.0"  # Добавляем обязательное поле
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

        update_data = agent_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            # Особая обработка для disk_space
            if field == 'disk_space' and (value is None or value == 'null' or value == ''):
                value = None
            setattr(agent, field, value)

        agent.updated_at = datetime.now()
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
        agent.last_seen = datetime.now()
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def get_offline_agents(db: Session, timeout_minutes: int) -> List[Agent]:
        """Получает агентов, которые не выходили на связь дольше timeout_minutes"""
        timeout_threshold = datetime.now() - timedelta(minutes=timeout_minutes)
        return db.query(Agent).filter(
            Agent.is_online == True,
            Agent.last_seen < timeout_threshold
        ).all()


crud_agent = CRUDAgent()