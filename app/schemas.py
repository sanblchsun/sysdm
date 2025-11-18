from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class AgentCreate(BaseModel):
    hostname: str
    platform: Optional[str]
    agent_uuid: str
    inventory: Optional[dict] = None

class AgentOut(BaseModel):
    id: int
    hostname: str
    platform: Optional[str]
    agent_uuid: str
    last_seen: Optional[datetime]
    is_online: bool
    inventory: Optional[dict] = None
    class Config:
        orm_mode = True
