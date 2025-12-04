# app/models/agent.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class Agent(Base):
    """Модель агента (управляемого компьютера)"""
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)

    # Идентификаторы
    agent_id = Column(String(100), unique=True, index=True, nullable=False)
    hostname = Column(String(255), nullable=False, index=True)

    # Сетевая информация
    local_ip = Column(String(45), nullable=False)
    public_ip = Column(String(45))
    mac_address = Column(String(17))

    # Системная информация
    operating_system = Column(String(255))
    platform = Column(String(50))  # windows, linux, darwin
    architecture = Column(String(10))  # x86, x64, arm64

    # Аппаратное обеспечение
    cpu_model = Column(String(255))
    cpu_cores = Column(Integer)
    total_ram = Column(Integer)  # MB
    disk_space = Column(JSON)  # JSON структура

    # Статус
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    agent_version = Column(String(20), default="1.0.0")

    # Организация
    site_id = Column(String(100), index=True)
    department = Column(String(100))
    description = Column(Text)

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)