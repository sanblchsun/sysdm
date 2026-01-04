from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.company import Company
from app.models.department import Department
from app.database import get_session
from app.models.agent import Agent
from app.api.v1.schemas.agent import (
    AgentCheckinIn,
    AgentCheckinOut,
    AgentInstallIn,
    AgentInstallOut,
    InstallTokenOut,
)
from app.api.v1.schemas.agent import AgentRegister, AgentListItem
from app.models.install_token import InstallToken

router = APIRouter(prefix="/agents", tags=["agents"])
from fastapi import Query
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import selectinload


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
    agent.last_seen = datetime.now(timezone.utc)

    await session.commit()

    return {
        "status": "ok",
        "agent_id": agent.id,
        "server_time": datetime.now(timezone.utc),
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


@router.post("/install-token", response_model=InstallTokenOut)
async def generate_install_token(
    company_id: int,
    department_id: int,
    session: AsyncSession = Depends(get_session),
):
    # ✅ проверка company
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # ✅ проверка department
    department = await session.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    token = InstallToken(
        company_id=company_id,
        department_id=department_id,
    )

    session.add(token)
    await session.commit()
    await session.refresh(token)

    return {"token": token.token}


@router.post("/install", response_model=AgentInstallOut)
async def install_agent(
    payload: AgentInstallIn,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(InstallToken).where(InstallToken.token == payload.token)
    )
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(status_code=404, detail="Invalid install token")

    agent = Agent(
        hostname=payload.hostname,
        department_id=token.department_id,
        is_online=False,
    )

    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    # ❗ одноразовый токен
    await session.delete(token)
    await session.commit()

    return {"agent_id": agent.id}


@router.get("/list", response_model=list[AgentListItem])
async def list_agents(
    company_id: int | None = None,
    department_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Agent).options(
        selectinload(Agent.department).selectinload(Department.company)
    )

    if department_id:
        stmt = stmt.where(Agent.department_id == department_id)

    elif company_id:
        stmt = stmt.join(Department).where(Department.company_id == company_id)

    result = await session.execute(stmt)
    agents = result.scalars().all()

    return [
        AgentListItem(
            id=a.id,
            hostname=a.hostname,
            company=a.department.company.name,
            department=a.department.name,
            is_online=a.is_online,
            last_seen=a.last_seen,
            ip_address=a.ip_address,
            os=a.os,
        )
        for a in agents
    ]
