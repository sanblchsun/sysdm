# app/schemas/department.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.schemas.client import Client

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
    client: Optional[Client] = None

class DepartmentWithAgents(Department):
    agents: List['Agent'] = []

class DepartmentTree(Department):
    children: List['DepartmentTree'] = []