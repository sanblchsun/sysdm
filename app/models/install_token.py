from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import secrets

class InstallToken(Base):
    __tablename__ = "install_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        default=lambda: secrets.token_hex(32),
    )

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
