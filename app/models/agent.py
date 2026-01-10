from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.company import Company

import secrets
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True)

    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    os: Mapped[str | None] = mapped_column(String(255))

    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime)

    # Новое поле company_id
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # По желанию старое nullable поле
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Связи
    company: Mapped["Company"] = relationship(back_populates="agents")
    department: Mapped["Department"] = relationship(back_populates="agents")

    # токен для установки
    install_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, default=lambda: secrets.token_hex(32)
    )
