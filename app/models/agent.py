# app/models/agent.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(100), unique=True, index=True, nullable=False)
    hostname = Column(String(255), nullable=False)
    local_ip = Column(String(15), nullable=False)
    public_ip = Column(String(15))
    mac_address = Column(String(17))
    operating_system = Column(String(100))
    platform = Column(String(50))
    architecture = Column(String(50))
    cpu_model = Column(String(100))
    cpu_cores = Column(Integer)
    total_ram = Column(Integer)  # В мегабайтах

    # Важно: используйте JSONB для PostgreSQL или JSON для других БД
    # Если у вас PostgreSQL, лучше использовать JSONB
    disk_space = Column(JSON, nullable=True)  # nullable=True позволяет NULL

    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime)
    agent_version = Column(String(50), default="1.0.0")  # Добавьте это поле!
    site_id = Column(String(100))
    department = Column(String(100))
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    notes = Column(Text)