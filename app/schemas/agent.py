# app/schemas/agent.py
from pydantic import BaseModel



class DiskInfoSchema(BaseModel):
    name: str
    size: int
    free: int


class AgentRegisterIn(BaseModel):
    machine_uid: str
    name_pc: str

    exe_version: str | None = None
    company_id: int | None = None
    system: str | None = None
    user_name: str | None = None
    ip_addr: str | None = None

    disks: list[DiskInfoSchema] = []
    total_memory: int | None = None
    available_memory: int | None = None
    external_ip: str | None = None


class AgentRegisterOut(BaseModel):
    agent_uuid: str
    token: str


class AgentTelemetryIn(BaseModel):
    system: str | None = None
    user_name: str | None = None
    ip_addr: str | None = None
    disks: list[DiskInfoSchema] = []
    total_memory: int | None = None
    available_memory: int | None = None
    external_ip: str | None = None
    exe_version: str | None = None


# Schema for UAC control
class AgentUACControl(BaseModel):
    action: str  # "disable"


# Schema for login session
class LoginSessionIn(BaseModel):
    username: str
    password: str


class PendingCommandOut(BaseModel):
    type: str | None = None
    data: dict | None = None



