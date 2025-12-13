# app/models/department.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)

    # Внешние ключи
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=True)

    # Таймстампы
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Связи
    client = relationship("Client", back_populates="departments")
    agents = relationship("Agent", back_populates="department")
    parent = relationship("Department", remote_side=[id], back_populates="children")
    children = relationship("Department", back_populates="parent")

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}', client_id={self.client_id})>"