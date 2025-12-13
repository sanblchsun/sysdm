# app/schemas/client.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class ClientBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ClientWithDepartments(Client):
    departments: List['Department'] = []

class ClientTree(Client):
    departments: List['DepartmentTree'] = []