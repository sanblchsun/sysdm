from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.company import Company

if TYPE_CHECKING:
    from app.models.agent import Agent


import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    __table_args__ = (
        sa.UniqueConstraint("company_id", "name", name="uq_departments_company_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )

    company: Mapped["Company"] = relationship(back_populates="departments")

    agents: Mapped[list["Agent"]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )
