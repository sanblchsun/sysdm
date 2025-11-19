from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from app.database import Base


class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=True)
    agent_uuid = Column(String, unique=True, nullable=False, index=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    inventory = Column(Text, nullable=True)
    is_online = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)

