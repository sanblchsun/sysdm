from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_session
from app.models.agent import Agent
from app.api.v1.schemas.agent import AgentCheckinIn, AgentCheckinOut

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/checkin", response_model=AgentCheckinOut)
async def agent_checkin(
    payload: AgentCheckinIn,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Agent).where(Agent.id == payload.agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.is_online = True
    agent.last_seen = datetime.utcnow()

    await session.commit()

    return {
        "status": "ok",
        "agent_id": agent.id,
        "server_time": datetime.utcnow(),
        "tasks": [],
    }
