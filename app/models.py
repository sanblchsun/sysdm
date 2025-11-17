# app/models.py
from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)
