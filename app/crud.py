from sqlalchemy.orm import Session
from . import models, schemas
import json

def create_user(db: Session, username: str, hashed_password: str, role: str = "admin"):
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        return user
    u = models.User(username=username, hashed_password=hashed_password, role=role, is_active=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_agent(db: Session, agent_in: schemas.AgentCreate):
    inv_json = json.dumps(agent_in.inventory or {})
    db_agent = models.Agent(
        hostname=agent_in.hostname,
        platform=agent_in.platform,
        agent_uuid=agent_in.agent_uuid,
        inventory=inv_json,
        is_online=True
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def get_agent_by_uuid(db: Session, agent_uuid: str):
    return db.query(models.Agent).filter(models.Agent.agent_uuid == agent_uuid).first()

def list_agents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Agent).offset(skip).limit(limit).all()

def get_agent(db: Session, agent_id: int):
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()
