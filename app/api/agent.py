# app/api/agent.py
from pathlib import Path
from fastapi.responses import FileResponse, StreamingResponse
from loguru import logger
import os
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import secrets
from datetime import datetime, timezone
from app.core.auth_agent import get_agent_by_token
from app.database import get_db
from app.models import Agent, AgentAdditionalData, Company
from app.schemas.agent import (
    AgentRegisterIn,
    AgentRegisterOut,
    AgentTelemetryIn,
    AgentUACControl,
    LoginSessionIn,

)
from sqlalchemy import select
from app.schemas.agent_update import (
    AgentCheckUpdateIn,
    AgentCheckUpdateOut,
)
from app.models import AgentBuild
from app.utils.hash import sha256_file
from fastapi import Body
from app.config import settings
from app.api.relay import get_agent, send_command_to_agent
from app.redis_client import get_redis
import json

# -------------------- TOP PANEL --------------------
router = APIRouter(prefix="/api/agent", tags=["agent"])

# Rate limiter (initialized in main.py)
def get_limiter():
    from app.main import limiter
    return limiter

# ==================== COMMANDS (Redis Pub/Sub) ====================
# Commands are published via Redis Pub/Sub for immediate delivery
# Results are stored in queue for agent to poll
# NOTE: Channel must match relay.py: ctrl:to:{uuid} for main process
REDIS_COMMAND_CHANNEL = "ctrl:to:{uuid}"

async def _publish_command(uuid: str, command: dict):
    """Publish command to main agent process via Redis Pub/Sub (immediate delivery, not polled)"""
    r = await get_redis()
    channel = REDIS_COMMAND_CHANNEL.format(uuid=uuid)
    await r.publish(channel, json.dumps(command))  # type: ignore[misc]




@router.post("/register", response_model=AgentRegisterOut)
async def register_agent(
    request: Request,
    data: AgentRegisterIn,
    session: AsyncSession = Depends(get_db),
):
    """
    Регистрация нового агента или обновление существующего.
    Автоматическое определение компании по external_ip.
    """

    # -------------------------
    # 1. Определяем IP агента
    # -------------------------
    if not settings.DISABLE_IP_FILTER:
        # Режим интернета: используем external_ip агента для поиска компании
        client_ip = data.external_ip
        if not client_ip:
            # Если агент не передал external_ip, берём IP подключения
            if request.client:
                client_ip = request.client.host
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
    else:
        # Режим локальной сети: фильтр отключен, IP не используется для поиска компании
        client_ip = None

    agent_external_ip = data.external_ip

    # -------------------------
    # 2. Определяем компанию
    # -------------------------
    company_id = data.company_id

    if not company_id:
        if not settings.DISABLE_IP_FILTER:
            # Интернет-режим: ищем компанию по external_ip
            if not client_ip:
                raise HTTPException(
                    status_code=400, detail="Cannot determine client IP"
                )
            result = await session.execute(
                select(Company).where(Company.external_ip == client_ip)
            )
            company = result.scalars().first()
            if company:
                company_id = company.id
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot determine company for agent with IP {client_ip}. Pass company_id explicitly.",
                )
        else:
            # Локальная сеть: берём первую компанию как дефолтную
            result = await session.execute(select(Company).limit(1))
            company = result.scalars().first()
            if not company:
                raise HTTPException(
                    status_code=400,
                    detail="No companies found. Create a company or pass company_id explicitly.",
                )
            company_id = company.id
    else:
        # проверяем, что компания существует
        company = await session.get(Company, company_id)
        if not company:
            raise HTTPException(
                status_code=404, detail=f"Company with id {company_id} not found"
            )

    # -------------------------
    # 3. Ищем агента по machine_uid
    # -------------------------
    result = await session.execute(
        select(Agent).where(Agent.machine_uid == data.machine_uid)
    )
    agent: Agent | None = result.scalars().first()  # type: ignore[assignment]

    now = datetime.now(timezone.utc)

    if agent:
        # обновляем существующего
        agent.name_pc = data.name_pc
        agent.last_seen = now
        agent.company_id = company_id
        agent.exe_version = data.exe_version
    else:
        # создаём нового
        token = secrets.token_urlsafe(32)
        agent = Agent(
            machine_uid=data.machine_uid,
            name_pc=data.name_pc,
            company_id=company_id,
            department_id=None,
            token=token,
            is_active=True,
            last_seen=now,
            exe_version=data.exe_version,
        )
        session.add(agent)
        await session.flush()

    # -------------------------
    # 4. Обновляем additional_data
    # -------------------------
    result = await session.execute(
        select(AgentAdditionalData).where(AgentAdditionalData.agent_id == agent.id)
    )
    additional = result.scalars().first()
    if not additional:
        additional = AgentAdditionalData(agent_id=agent.id)
        session.add(additional)

    additional.system = data.system
    additional.user_name = data.user_name
    additional.ip_addr = client_ip
    additional.disks = [d.model_dump() for d in data.disks]
    additional.total_memory = data.total_memory
    additional.available_memory = data.available_memory
    additional.external_ip = client_ip
    if data.encoder_capabilities is not None:
        additional.encoder_capabilities = data.encoder_capabilities

    await session.commit()

    return AgentRegisterOut(agent_uuid=agent.uuid, token=agent.token)


@router.post("/telemetry")
async def agent_telemetry(
    data: AgentTelemetryIn,
    agent=Depends(get_agent_by_token),
    session: AsyncSession = Depends(get_db),
):
    # Обновляем AgentAdditionalData
    result = await session.execute(
        select(AgentAdditionalData).where(AgentAdditionalData.agent_id == agent.id)
    )
    additional = result.scalars().first()
    if not additional:
        additional = AgentAdditionalData(agent_id=agent.id)
        session.add(additional)

    additional.system = data.system
    additional.user_name = data.user_name
    additional.ip_addr = data.ip_addr
    additional.disks = [d.model_dump() for d in data.disks]
    additional.total_memory = data.total_memory
    additional.available_memory = data.available_memory
    additional.external_ip = data.external_ip
    if data.encoder_capabilities is not None:
        additional.encoder_capabilities = data.encoder_capabilities

    # Обновляем exe_version в Agent
    if data.exe_version:
        agent.exe_version = data.exe_version

    agent.last_seen = datetime.now(timezone.utc)
    await session.commit()
    return {"status": "ok", "agent_uuid": agent.uuid}





@router.post("/check-update", response_model=AgentCheckUpdateOut)
async def check_update(
    data: AgentCheckUpdateIn,
    agent: Agent = Depends(get_agent_by_token),
    session: AsyncSession = Depends(get_db),
):
    # активный билд
    result = await session.execute(
        select(AgentBuild).where(AgentBuild.is_active.is_(True))
    )
    active_build = result.scalars().first()

    if not active_build:
        return AgentCheckUpdateOut(update=False)

    # если версия совпадает
    if data.build == active_build.build_slug:
        return AgentCheckUpdateOut(update=False)

    company_slug = agent.company.slug
    filename = f"agent_universal_{active_build.build_slug}.exe"
    filepath = os.path.join("dist", "agents", filename)

    if not os.path.isfile(filepath):
        return AgentCheckUpdateOut(update=False)

    return AgentCheckUpdateOut(
        update=True,
        build=active_build.build_slug,
        url=(
            f"{settings.APP_HOST}/api/agent/download"
            f"?build={active_build.build_slug}"
            f"&uuid={agent.uuid}"
            f"&token={agent.token}"
        ),
        sha256=active_build.sha256,
        force=False,
    )


@router.get("/download")
async def download_agent_build(
    build: str,
    agent: Agent = Depends(get_agent_by_token),
):
    """
    Защищённая загрузка билда.
    Доступна только агенту с валидным uuid+token.
    """

    filename = f"agent_universal_{build}.exe"

    base_path = Path("dist") / "agents"
    file_path = base_path / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Build file not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@router.post("/company/{company_id}/set-external-ip")
async def set_external_ip(
    company_id: int,
    external_ip: str = Form(...),
    session: AsyncSession = Depends(get_db),
):
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.external_ip = external_ip
    await session.commit()

    return {"status": "ok", "external_ip": company.external_ip}


@router.post("/{agent_id}/control-uac")
async def control_uac(
    agent_id: int,
    data: AgentUACControl,
    session: AsyncSession = Depends(get_db),
):
    """Control UAC settings on remote agent."""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if data.action != "disable":
        raise HTTPException(
            status_code=400, detail="Invalid action. Supported: 'disable'"
        )

    # Send command to agent via WebSocket control channel
    command = {"type": "command", "cmd": "disable-uac"}
    agent_connected = await send_command_to_agent(agent.uuid, command)

    message = "UAC disable command sent to agent (requires reboot to take effect)"
    if not agent_connected:
        message = (
            "Agent is not currently connected. Command will be queued and executed "
            "when agent comes online. (requires reboot to take effect)"
        )

    return {
        "status": "ok",
        "message": message,
        "action": "disable",
        "requires_reboot": True,
        "agent_connected": agent_connected,
    }


@router.post("/{agent_id}/request-telemetry")
async def agent_request_telemetry(
    agent_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Request telemetry from agent (sends command via WebSocket)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {"type": "telemetry-request"}
    agent_connected = await send_command_to_agent(agent.uuid, command)

    return {
        "status": "ok",
        "message": "Telemetry request sent to agent",
        "agent_connected": agent_connected,
    }


@router.post("/{agent_id}/reboot")
async def agent_reboot(
    agent_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Send reboot command to agent"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {"type": "command", "cmd": "reboot"}
    agent_connected = await send_command_to_agent(agent.uuid, command)

    message = "Reboot command sent to agent"
    if not agent_connected:
        message = "Agent is not currently connected via WebSocket"

    return {
        "status": "ok",
        "message": message,
        "agent_connected": agent_connected,
    }


@router.post("/{agent_id}/start-rdp")
async def start_rdp(
    agent_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Send command to agent to start RDP worker process"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    relay_agent = await get_agent(agent.uuid)
    timeout = relay_agent.rdp_timeout_target

    command = {
        "type": "command",
        "cmd": "start-rdp-worker",
        "timeout": timeout,
        "codec": relay_agent.codec_target,
        "encoder": relay_agent.encoder_target,
        "bitrate": relay_agent.bitrate_target,
        "fps": relay_agent.fps_target,
        "mjpeg_q": relay_agent.mjpeg_q_target,
    }
    agent_connected = await send_command_to_agent(agent.uuid, command)

    message = "RDP start command sent to agent"
    if not agent_connected:
        message = "Agent is not currently connected via WebSocket"

    return {
        "status": "ok",
        "message": message,
        "agent_connected": agent_connected,
        "timeout": timeout,
    }


@router.post("/stop-rdp-by-uuid/{uuid}")
async def stop_rdp_by_uuid(
    uuid: str,
    session: AsyncSession = Depends(get_db),
):
    """Stop RDP worker by agent UUID"""
    result = await session.execute(
        select(Agent).where(Agent.uuid == uuid)
    )
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await _stop_worker(agent.uuid)

    return {
        "status": "ok",
        "message": "RDP stop command sent to agent",
    }


# ==================== DASHBOARD AVAILABILITY (SSE-BASED) ====================
import asyncio

_dashboard_sse: dict[str, datetime] = {}  # uuid → when SSE was established
_heartbeat_task: asyncio.Task | None = None


async def _stop_worker(uuid: str):
    """Send stop-rdp-worker to agent via WebSocket (Redis Pub/Sub → relay.py → agent WS)."""
    command = {"type": "command", "cmd": "stop-rdp-worker"}
    await _publish_command(uuid, command)


async def _heartbeat_checker():
    """Every 5s check dashboard SSE connections. If disconnected → stop worker."""
    while True:
        await asyncio.sleep(5)
        now = datetime.now(timezone.utc)
        dead = [uuid for uuid, last in _dashboard_sse.items()
                if (now - last).total_seconds() > 10]
        for uuid in dead:
            try:
                _dashboard_sse.pop(uuid, None)
                logger.info(f"[dashboard] agent {uuid} SSE disconnected, stopping worker")
                await _stop_worker(uuid)
            except Exception:
                logger.exception(f"[dashboard] failed to stop worker for {uuid}")


def _ensure_heartbeat():
    global _heartbeat_task
    if _heartbeat_task is None:
        _heartbeat_task = asyncio.create_task(_heartbeat_checker())


@router.post("/watch-agent")
async def watch_agent(uuid: str):
    """Dashboard reports it's running. Server will start monitoring availability."""
    _ensure_heartbeat()
    logger.info(f"[watch-agent] dashboard opened for uuid={uuid}")
    return {"status": "ok"}


@router.get("/dashboard-monitor")
async def dashboard_monitor(uuid: str):
    """SSE endpoint. Server monitors this connection to detect dashboard availability."""
    _ensure_heartbeat()
    _dashboard_sse[uuid] = datetime.now(timezone.utc)

    async def event_generator():
        try:
            while True:
                _dashboard_sse[uuid] = datetime.now(timezone.utc)
                yield ": keepalive\n\n"
                await asyncio.sleep(3)
        except (asyncio.CancelledError, Exception):
            pass
        finally:
            ...

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ==================== SESSION SWITCH (pending commands for SYSTEM process) ====================


@router.post("/{agent_id}/login-session")
async def login_session(
    agent_id: int,
    data: LoginSessionIn,
    session: AsyncSession = Depends(get_db),
):
    """Queue login-session command for agent to switch to another Windows user"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {
        "type": "command",
        "cmd": "login-user",
        "username": data.username,
        "password": data.password,
    }
    await send_command_to_agent(agent.uuid, command)

    return {"status": "ok", "message": f"Login command queued for {data.username}"}


@router.post("/{agent_id}/login-session-fast")
async def login_session_fast(
    agent_id: int,
    data: LoginSessionIn,
    session: AsyncSession = Depends(get_db),
):
    """Queue login-session command for agent (fast logoff-based approach, no reboot)"""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {
        "type": "command",
        "cmd": "login-user-fast",
        "username": data.username,
        "password": data.password,
    }
    await send_command_to_agent(agent.uuid, command)

    return {"status": "ok", "message": f"Fast login command queued for {data.username}"}


