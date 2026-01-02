from datetime import datetime
from pydantic import BaseModel


class AgentCheckinIn(BaseModel):
    agent_id: int


class AgentCheckinOut(BaseModel):
    status: str
    agent_id: int
    server_time: datetime
    tasks: list
