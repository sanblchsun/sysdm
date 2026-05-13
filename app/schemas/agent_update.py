# app/schemas/agent_update.py
from pydantic import BaseModel



class AgentCheckUpdateIn(BaseModel):
    build: str


class AgentCheckUpdateOut(BaseModel):
    update: bool
    build: str | None = None
    url: str | None = None
    sha256: str | None = None
    force: bool = False
