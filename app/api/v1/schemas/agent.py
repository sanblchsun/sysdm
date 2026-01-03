from datetime import datetime
from pydantic import BaseModel


class AgentCheckinIn(BaseModel):
    agent_id: int


class AgentCheckinOut(BaseModel):
    status: str
    agent_id: int
    server_time: datetime
    tasks: list


class AgentRegister(BaseModel):
    hostname: str
    department_id: int


class InstallTokenOut(BaseModel):
    token: str


class AgentInstallIn(BaseModel):
    hostname: str
    token: str


class AgentInstallOut(BaseModel):
    agent_id: int
