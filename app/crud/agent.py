# app/crud/agent.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from app.models import agent as models
from app.models import department as department_models
from app.schemas import agent as schemas

def get_agent(db: Session, agent_id: int) -> Optional[models.Agent]:
    """Получить агента по ID"""
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()

def get_agent_by_agent_id(db: Session, agent_id_str: str) -> Optional[models.Agent]:
    """Получить агента по уникальному идентификатору агента"""
    return db.query(models.Agent).filter(models.Agent.agent_id == agent_id_str).first()

def get_agents(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[int] = None,
    is_online: Optional[bool] = None,
    platform: Optional[str] = None,
    search: Optional[str] = None
) -> List[models.Agent]:
    """Получить список агентов с фильтрацией"""
    query = db.query(models.Agent)

    # Фильтрация по отделу
    if department_id is not None:
        query = query.filter(models.Agent.department_id == department_id)

    # Фильтрация по статусу онлайн
    if is_online is not None:
        query = query.filter(models.Agent.is_online == is_online)

    # Фильтрация по платформе
    if platform:
        query = query.filter(models.Agent.platform == platform)

    # Поиск по нескольким полям
    if search:
        search_filter = or_(
            models.Agent.hostname.ilike(f"%{search}%"),
            models.Agent.agent_id.ilike(f"%{search}%"),
            models.Agent.local_ip.ilike(f"%{search}%"),
            models.Agent.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # Сортировка по последней активности
    query = query.order_by(desc(models.Agent.last_seen), desc(models.Agent.created_at))

    return query.offset(skip).limit(limit).all()

def get_agents_by_department(
    db: Session,
    department_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[models.Agent]:
    """Получить агентов по отделу"""
    return get_agents(db, skip=skip, limit=limit, department_id=department_id)

def get_online_agents(db: Session, minutes: int = 5) -> List[models.Agent]:
    """Получить онлайн агентов (активные за последние N минут)"""
    time_threshold = datetime.utcnow() - timedelta(minutes=minutes)
    return db.query(models.Agent).filter(
        models.Agent.is_online == True,
        models.Agent.last_seen >= time_threshold
    ).all()

def get_agents_statistics(db: Session) -> Dict[str, Any]:
    """Получить статистику по агентам"""
    total = db.query(models.Agent).count()
    online = db.query(models.Agent).filter(models.Agent.is_online == True).count()
    offline = total - online

    # Статистика по платформам
    platforms = db.query(
        models.Agent.platform,
        db.func.count(models.Agent.id).label('count')
    ).group_by(models.Agent.platform).all()

    # Агенты по отделам
    agents_by_department = db.query(
        models.Agent.department_id,
        db.func.count(models.Agent.id).label('count')
    ).group_by(models.Agent.department_id).all()

    # Последние активные агенты
    recent_agents = db.query(models.Agent).order_by(
        desc(models.Agent.last_seen)
    ).limit(10).all()

    return {
        'total_agents': total,
        'online_agents': online,
        'offline_agents': offline,
        'platforms': {platform: count for platform, count in platforms if platform},
        'by_department': {dept_id: count for dept_id, count in agents_by_department if dept_id},
        'recent_agents': recent_agents
    }

def create_agent(db: Session, agent: schemas.AgentCreate) -> models.Agent:
    """Создать нового агента"""

    # Проверяем уникальность agent_id
    existing = get_agent_by_agent_id(db, agent.agent_id)
    if existing:
        raise ValueError(f"Agent with agent_id '{agent.agent_id}' already exists")

    # Проверяем существование отдела (если указан)
    if agent.department_id:
        department = db.query(department_models.Department).filter(
            department_models.Department.id == agent.department_id
        ).first()

        if not department:
            raise ValueError(f"Department with id {agent.department_id} does not exist")

    db_agent = models.Agent(
        hostname=agent.hostname,
        agent_id=agent.agent_id,
        local_ip=agent.local_ip,
        public_ip=agent.public_ip,
        mac_address=agent.mac_address,
        operating_system=agent.operating_system,
        platform=agent.platform,
        architecture=agent.architecture,
        cpu_model=agent.cpu_model,
        cpu_cores=agent.cpu_cores,
        total_ram=agent.total_ram,
        disk_space=agent.disk_space,
        is_online=agent.is_online,
        agent_version=agent.agent_version,
        site_id=agent.site_id,
        description=agent.description,
        notes=agent.notes,
        department_id=agent.department_id,
        last_seen=datetime.utcnow() if agent.is_online else None
    )

    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def update_agent(
    db: Session,
    db_agent: models.Agent,
    agent_update: schemas.AgentCreate
) -> models.Agent:
    """Обновить агента"""

    # Проверяем уникальность agent_id (если изменяется)
    if agent_update.agent_id != db_agent.agent_id:
        existing = get_agent_by_agent_id(db, agent_update.agent_id)
        if existing:
            raise ValueError(f"Agent with agent_id '{agent_update.agent_id}' already exists")

    # Проверяем существование отдела (если изменяется)
    if agent_update.department_id != db_agent.department_id and agent_update.department_id:
        department = db.query(department_models.Department).filter(
            department_models.Department.id == agent_update.department_id
        ).first()

        if not department:
            raise ValueError(f"Department with id {agent_update.department_id} does not exist")

    update_data = agent_update.model_dump(exclude_unset=True)

    # Обновляем last_seen если статус online изменился
    if 'is_online' in update_data and update_data['is_online']:
        update_data['last_seen'] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(db_agent, field, value)

    db.commit()
    db.refresh(db_agent)
    return db_agent

def delete_agent(db: Session, agent_id: int) -> bool:
    """Удалить агента"""
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return False

    db.delete(db_agent)
    db.commit()
    return True

def update_agent_heartbeat(db: Session, agent_id: str) -> Optional[models.Agent]:
    """Обновить heartbeat агента (отметить активность)"""
    db_agent = get_agent_by_agent_id(db, agent_id)
    if not db_agent:
        return None

    db_agent.last_seen = datetime.utcnow()
    db_agent.is_online = True
    db.commit()
    db.refresh(db_agent)
    return db_agent

def bulk_update_agent_department(
    db: Session,
    agent_ids: List[int],
    department_id: Optional[int]
) -> int:
    """Массовое обновление отдела для агентов"""
    if department_id is not None:
        # Проверяем существование отдела
        department = db.query(department_models.Department).filter(
            department_models.Department.id == department_id
        ).first()

        if not department:
            raise ValueError(f"Department with id {department_id} does not exist")

    updated = db.query(models.Agent).filter(
        models.Agent.id.in_(agent_ids)
    ).update(
        {'department_id': department_id},
        synchronize_session=False
    )

    db.commit()
    return updated

def search_agents(
    db: Session,
    query: str,
    department_id: Optional[int] = None,
    limit: int = 50
) -> List[models.Agent]:
    """Поиск агентов по нескольким полям"""
    search_q = db.query(models.Agent).filter(
        or_(
            models.Agent.hostname.ilike(f"%{query}%"),
            models.Agent.agent_id.ilike(f"%{query}%"),
            models.Agent.local_ip.ilike(f"%{query}%"),
            models.Agent.public_ip.ilike(f"%{query}%"),
            models.Agent.mac_address.ilike(f"%{query}%"),
            models.Agent.description.ilike(f"%{query}%"),
            models.Agent.notes.ilike(f"%{query}%")
        )
    )

    if department_id is not None:
        search_q = search_q.filter(models.Agent.department_id == department_id)

    return search_q.limit(limit).all()