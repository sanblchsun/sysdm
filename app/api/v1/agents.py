from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.department import Department
from app.database import get_session
from app.models.agent import Agent
from app.api.v1.schemas.agent import AgentCheckinIn, AgentCheckinOut
from app.api.v1.schemas.agent import AgentRegister

router = APIRouter(prefix="/agents", tags=["agents"])


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


@router.post("/register")
async def register_agent(
    payload: AgentRegister,
    session: AsyncSession = Depends(get_session),
):
    # Проверяем, что отдел существует
    result = await session.execute(
        select(Department).where(Department.id == payload.department_id)
    )
    department = result.scalar_one_or_none()

    if not department:
        raise HTTPException(status_code=400, detail="Department not found")

    agent = Agent(
        hostname=payload.hostname,
        department_id=payload.department_id,
        is_online=False,
    )

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return {"agent_id": agent.id}
