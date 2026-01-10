from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.agent import Agent

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    departments: Mapped[list["Department"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )

    # Обратная связь для агентов
    agents: Mapped[list["Agent"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
