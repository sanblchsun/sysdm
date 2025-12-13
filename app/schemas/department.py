# app/schemas/department.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

# Импортируем только типы для аннотаций
if TYPE_CHECKING:
    from app.schemas.client import Client
    from app.schemas.agent import Agent

class DepartmentBase(BaseModel):
    name: str
    client_id: int
    parent_id: Optional[int] = None
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DepartmentWithClient(Department):
    client: Optional['Client'] = None

class DepartmentWithAgents(Department):
    agents: List['Agent'] = []

# ВАЖНО: Определяем DepartmentTree с forward reference
class DepartmentTree(Department):
    children: List['DepartmentTree'] = []

# Импортируем после определения, чтобы избежать циклических импортов
from app.schemas.client import Client
DepartmentWithClient.update_forward_refs()
DepartmentTree.update_forward_refs()