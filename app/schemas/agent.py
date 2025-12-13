# app/schemas/agent.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any
from app.schemas.department import Department

class AgentBase(BaseModel):
    hostname: str
    agent_id: str
    local_ip: str
    public_ip: Optional[str] = None
    mac_address: Optional[str] = None
    operating_system: Optional[str] = None
    platform: Optional[str] = None
    architecture: Optional[str] = None
    cpu_model: Optional[str] = None
    cpu_cores: Optional[int] = None
    total_ram: Optional[int] = None
    disk_space: Optional[Dict[str, Any]] = None
    is_online: bool = False
    agent_version: str = "1.0.0"
    site_id: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    # ЗАМЕНА: department -> department_id
    department_id: Optional[int] = None

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int
    created_at: datetime
    last_seen: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AgentWithDepartment(Agent):
    department: Optional[Department] = None