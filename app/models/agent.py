import secrets
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.department import Department


import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from app.database import Base
from datetime import datetime


class Agent(Base):
    __tablename__ = "agents"

    __table_args__ = (
        sa.UniqueConstraint(
            "department_id", "hostname", name="uq_agents_department_hostname"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    ip_address: Mapped[str | None] = mapped_column(String(45))
    os: Mapped[str | None] = mapped_column(String(255))

    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department: Mapped["Department"] = relationship(back_populates="agents")
