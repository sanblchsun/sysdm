# app/api/agent.py
from pathlib import Path
from fastapi.responses import FileResponse
from loguru import logger
import os
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import secrets
from datetime import datetime, timezone, timedelta
from app.core.auth_agent import get_agent_by_token
from app.database import get_db
from app.models import Agent, AgentAdditionalData, Company
from app.schemas.agent import (
    AgentRegisterIn,
    AgentRegisterOut,
    AgentTelemetryIn,
    AgentUACControl,
    LoginSessionIn,
    CommandResultIn,
)
from sqlalchemy import select, update
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
UPDATE_INTERVAL = timedelta(seconds=60)

# Rate limiter (initialized in main.py)
def get_limiter():
    from app.main import limiter
    return limiter

# ==================== COMMANDS (Redis Pub/Sub) ====================
# Commands are published via Redis Pub/Sub for immediate delivery
# Results are stored in queue for agent to poll
# NOTE: Channel must match relay.py: ctrl:to:{uuid} for main process
REDIS_COMMAND_CHANNEL = "ctrl:to:{uuid}"
REDIS_PENDING_RESULT_KEY = "pending_result:{uuid}"
REDIS_PENDING_TTL = 300

async def _publish_command(uuid: str, command: dict):
    """Publish command to main agent process via Redis Pub/Sub (immediate delivery, not polled)"""
    r = await get_redis()
    channel = REDIS_COMMAND_CHANNEL.format(uuid=uuid)
    logger.debug(f"[publish_command] Publishing to {channel}: {command}")
    await r.publish(channel, json.dumps(command))  # type: ignore[misc]

async def _push_command_result(uuid: str, data: dict):
    """Store command result in queue for agent to poll"""
    r = await get_redis()
    key = REDIS_PENDING_RESULT_KEY.format(uuid=uuid)
    await r.rpush(key, json.dumps(data))  # type: ignore[misc]
    await r.expire(key, REDIS_PENDING_TTL)

# ==================== AGENT STATUS (Redis Pub/Sub) ====================
REDIS_AGENT_STATUS_CHANNEL = "agent:status"
REDIS_AGENT_TTL = 60  # Status TTL for online detection

async def _publish_agent_status(uuid: str, is_online: bool):
    """Publish agent online/offline status via Redis Pub/Sub for real-time UI updates"""
    r = await get_redis()
    status = {
        "uuid": uuid,
        "is_online": is_online,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await r.publish(REDIS_AGENT_STATUS_CHANNEL, json.dumps(status))  # type: ignore[misc]


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
                logger.warning("Cannot determine client IP for agent registration")
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

    # Обновляем exe_version в Agent
    if data.exe_version:
        agent.exe_version = data.exe_version

    agent.last_seen = datetime.now(timezone.utc)
    await session.commit()
    return {"status": "ok", "agent_uuid": agent.uuid}


@router.post("/heartbeat")
async def agent_heartbeat(
    uuid: str,
    token: str,
    agent: Agent = Depends(get_agent_by_token),
    session: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    
    # Handle both offset-aware and offset-naive datetimes from database
    last_seen = agent.last_seen
    if last_seen and last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    # Обновляем last_seen не чаще чем раз в UPDATE_INTERVAL секунд
    if not agent.last_seen or now - last_seen > UPDATE_INTERVAL:
        await session.execute(
            update(Agent).where(Agent.id == agent.id).values(last_seen=now)
        )
        await session.commit()

        # Publish agent online status to Redis for real-time UI updates (no polling delay)
        await _publish_agent_status(agent.uuid, is_online=True)

        return {
            "status": "ok",
            "agent_uuid": agent.uuid,
            "last_seen": now,
        }

    # Publish agent online status even if DB not updated (for responsive UI)
    await _publish_agent_status(agent.uuid, is_online=True)

    # Если обновление не требуется — не трогаем БД
    return {
        "status": "ok",
        "agent_uuid": agent.uuid,
        "last_seen": agent.last_seen,
        "telemetry_mode": agent.telemetry_mode,  # Tell agent what to send
    }


@router.post("/check-update", response_model=AgentCheckUpdateOut)
async def check_update(
    data: AgentCheckUpdateIn,
    agent: Agent = Depends(get_agent_by_token),
    session: AsyncSession = Depends(get_db),
):
    logger.info(
        "Agent %s check-update. Current build: %s",
        agent.uuid,
        data.build,
    )

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
        logger.error(f"Build file not found (check_update): {filepath}")
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
        logger.error(f"Build file not found (download): {file_path}")
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


# -------------------- TELEMETRY MODE --------------------
from app.schemas.agent import AgentTelemetryModeUpdate


@router.post("/{agent_id}/telemetry-mode")
async def set_telemetry_mode(
    agent_id: int,
    data: AgentTelemetryModeUpdate,
    session: AsyncSession = Depends(get_db),
):
    """Установить режим телеметрии для агента (none, basic, full)."""
    if data.telemetry_mode not in ["none", "basic", "full"]:
        raise HTTPException(
            status_code=400, detail="Invalid telemetry_mode. Use: none, basic, full"
        )

    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.telemetry_mode = data.telemetry_mode
    await session.commit()

    return {"status": "ok", "telemetry_mode": agent.telemetry_mode}


@router.post("/{agent_id}/control-uac")
async def control_uac(
    agent_id: int,
    data: AgentUACControl,
    session: AsyncSession = Depends(get_db),
):
    """Control UAC settings on remote agent."""
    logger.info(
        f"[control_uac] Received request: agent_id={agent_id}, action={data.action}"
    )

    agent = await session.get(Agent, agent_id)
    if not agent:
        logger.warning(f"[control_uac] Agent not found: {agent_id}")
        raise HTTPException(status_code=404, detail="Agent not found")

    if data.action != "disable":
        logger.warning(f"[control_uac] Invalid action: {data.action}")
        raise HTTPException(
            status_code=400, detail="Invalid action. Supported: 'disable'"
        )

    logger.info(
        f"[control_uac] UAC disable requested for agent {agent.uuid} (id={agent_id})"
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
        logger.warning(f"[control_uac] Agent {agent.uuid} not connected - queuing command")

    return {
        "status": "ok",
        "message": message,
        "action": "disable",
        "requires_reboot": True,
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
        logger.warning(f"[reboot] Agent {agent.uuid} not connected")

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
    }
    agent_connected = await send_command_to_agent(agent.uuid, command)

    message = "RDP start command sent to agent"
    if not agent_connected:
        message = "Agent is not currently connected via WebSocket"
        logger.warning(f"[start-rdp] Agent {agent.uuid} not connected")

    return {
        "status": "ok",
        "message": message,
        "agent_connected": agent_connected,
        "timeout": timeout,
    }


@router.post("/{agent_id}/stop-rdp")
async def stop_rdp(
    agent_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Stop RDP worker - deliver via both Redis Pub/Sub (real-time) and pending queue (fallback)"""
    logger.warning(f"[stop-rdp] *** CALLED: Stopping RDP for agent_id={agent_id} ***")
    
    agent = await session.get(Agent, agent_id)
    if not agent:
        logger.error(f"[stop-rdp] Agent not found: {agent_id}")
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {
        "type": "command",
        "cmd": "stop-rdp-worker",
    }
    
    logger.warning(f"[stop-rdp] Publishing command to Pub/Sub for {agent.uuid}")
    # Delivery #1: Redis Pub/Sub for real-time delivery via WebSocket
    # - Worker WebSocket: receives immediately, ignores it
    # - Main WebSocket: receives immediately, processes it
    await _publish_command(agent.uuid, command)

    # Delivery #2: Pending commands queue as fallback
    # - If WebSocket disconnected, main will get it on next 30s poll
    # - Ensures command is NOT lost even if both WebSocket'ы are offline
    # Create a Redis queue entry that persists for HTTP polling
    from app.redis_client import get_redis
    r = await get_redis()
    
    # Store in Redis List for pending-command polling (30s interval)
    # Use longer TTL to survive brief WebSocket disconnections
    pending_key = f"pending_cmd:{agent.uuid}"
    logger.warning(f"[stop-rdp] Storing command in pending queue: {pending_key}")
    
    push_result = await r.rpush(pending_key, json.dumps(command))  # type: ignore[misc]
    logger.warning(f"[stop-rdp] Redis RPUSH result: {push_result} (1=success)")
    
    expire_result = await r.expire(pending_key, 600)  # 10 minutes TTL (covers multiple polling cycles)
    logger.warning(f"[stop-rdp] Redis EXPIRE result: {expire_result} (1=success)")

    logger.warning(f"[stop-rdp] *** DONE: Command queued for agent {agent.uuid} ***")

    return {
        "status": "ok",
        "message": "RDP stop command sent via Pub/Sub and queued for main process",
    }


@router.post("/stop-rdp-by-uuid/{uuid}")
async def stop_rdp_by_uuid(
    uuid: str,
    session: AsyncSession = Depends(get_db),
):
    """Stop RDP worker by agent UUID (used by dashboard on page close)"""
    logger.warning(f"[stop-rdp-by-uuid] *** CALLED: Stopping RDP for UUID={uuid} ***")
    
    # Find agent by UUID
    result = await session.execute(
        select(Agent).where(Agent.uuid == uuid)
    )
    agent = result.scalars().first()
    
    if not agent:
        logger.error(f"[stop-rdp-by-uuid] Agent not found by UUID: {uuid}")
        raise HTTPException(status_code=404, detail="Agent not found")

    command = {
        "type": "command",
        "cmd": "stop-rdp-worker",
    }
    
    logger.warning(f"[stop-rdp-by-uuid] Publishing command to Pub/Sub for {agent.uuid}")
    # Delivery #1: Redis Pub/Sub for real-time delivery via WebSocket
    await _publish_command(agent.uuid, command)

    # Delivery #2: Pending commands queue as fallback
    from app.redis_client import get_redis
    r = await get_redis()
    
    # Store in Redis List for pending-command polling
    pending_key = f"pending_cmd:{agent.uuid}"
    logger.warning(f"[stop-rdp-by-uuid] Storing command in pending queue: {pending_key}")
    
    push_result = await r.rpush(pending_key, json.dumps(command))  # type: ignore[misc]
    logger.warning(f"[stop-rdp-by-uuid] Redis RPUSH result: {push_result}")
    
    expire_result = await r.expire(pending_key, 600)
    logger.warning(f"[stop-rdp-by-uuid] Redis EXPIRE result: {expire_result}")

    logger.warning(f"[stop-rdp-by-uuid] *** DONE: Command queued for agent {agent.uuid} ***")

    return {
        "status": "ok",
        "message": "RDP stop command sent via Pub/Sub and queued for main process",
    }


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
    logger.info(f"[login-session] Command sent to agent {agent.uuid}: {data.username}")

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
    logger.info(f"[login-session-fast] Published for agent {agent.uuid}: {data.username}")

    return {"status": "ok", "message": f"Fast login command queued for {data.username}"}


@router.get("/pending-command")
async def pending_command(
    uuid: str,
    token: str,
    _=Depends(get_agent_by_token),
):
    """Return next pending command from queue (fallback for WebSocket delivery)
    Used when agent WebSocket is offline or as secondary delivery mechanism.
    Commands are queued with TTL (10 minutes for stop-rdp, etc).
    """
    r = await get_redis()
    
    # Check pending commands queue
    pending_key = f"pending_cmd:{uuid}"
    try:
        # First check if queue exists and has commands
        queue_len = await r.llen(pending_key)  # type: ignore[misc]
        logger.debug(f"[pending-command] Queue {pending_key} length: {queue_len}")
        
        command_json = await r.lpop(pending_key)  # type: ignore[misc]
        if command_json:
            command = json.loads(command_json)
            logger.warning(f"[pending-command] *** FOUND COMMAND in queue {pending_key}: {command}")
            return command
        else:
            logger.debug(f"[pending-command] No command in queue {pending_key}")
    except Exception as e:
        logger.error(f"[pending-command] Error checking queue for {uuid}: {e}")
    
    # No pending command
    return {"type": None}


@router.post("/command-result")
async def command_result(
    uuid: str,
    token: str,
    data: CommandResultIn,
    _=Depends(get_agent_by_token),
):
    """Agent reports result of executing a pending command"""
    await _push_command_result(uuid, data.model_dump())
    logger.info(f"[command-result] agent={uuid} type={data.command_type} success={data.success} msg={data.message}")
    return {"status": "ok"}
