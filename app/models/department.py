from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.company import Company
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

    @classmethod
    async def get_or_create_unassigned(cls, company_id: int, session):
        """Возвращает отдел 'Unassigned' для компании, создавая если не существует."""
        result = await session.execute(
            sa.select(cls).where(cls.company_id == company_id, cls.name == "Unassigned")
        )
        dept = result.scalar_one_or_none()
        if not dept:
            dept = cls(name="Unassigned", company_id=company_id)
            session.add(dept)
            await session.commit()
            await session.refresh(dept)
        return dept
