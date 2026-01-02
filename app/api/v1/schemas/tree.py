from pydantic import BaseModel
from typing import List


class AgentOut(BaseModel):
    id: int
    hostname: str
    is_online: bool

    class Config:
        orm_mode = True


class DepartmentOut(BaseModel):
    id: int
    name: str
    agents: List[AgentOut] = []

    class Config:
        orm_mode = True


class CompanyOut(BaseModel):
    id: int
    name: str
    departments: List[DepartmentOut] = []

    class Config:
        orm_mode = True
