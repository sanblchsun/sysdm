# app/api/relay.py
# Stream relay: MJPEG + H.264, управление мышью через WebSocket
import asyncio
import concurrent.futures
import socket
import time
import json
from typing import Dict, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, PlainTextResponse
from loguru import logger
from sqlalchemy import select

from app.core.authx import auth
from app.database import AsyncSessionLocal
from app.models import User
from app.schemas.relay import RelayConfigBody, AgentsListResponse, AgentStatusResponse

router = APIRouter(prefix="/relay", tags=["relay"])
_mjpeg_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)


# ============ MODELS ============
class AgentState:
    """Состояние агента и его потоков"""

    __slots__ = (
        "codec_target",
        "encoder_target",
        "bitrate_target",
        "fps_target",
        "mjpeg_q_target",
        "rdp_timeout_target",
        "codec_current",
        "encoder_current",
        "bitrate_current",
        "fps_current",
        "mjpeg_queue",
        "h264_keyframe_buffer",
        "h264_subscribers",
        "h264_count",
        "updated",
        "started",
    )

    def __init__(self):
        self.codec_target = "mjpeg"
        self.encoder_target = "cpu"
        self.bitrate_target = "4M"
        self.fps_target = 30
        self.mjpeg_q_target = 4
        self.rdp_timeout_target = 30

        self.codec_current: Optional[str] = None
        self.encoder_current: Optional[str] = None
        self.bitrate_current: Optional[str] = None
        self.fps_current: Optional[int] = None

        self.mjpeg_queue: asyncio.Queue = asyncio.Queue(maxsize=2)

        self.h264_keyframe_buffer = bytearray()
        self.h264_subscribers: Set[asyncio.Queue] = set()
        self.h264_count: int = 0

        self.updated: float = 0.0
        self.started: float = time.time()

    def push_mjpeg(self, frame: bytes):
        self.updated = time.time()
        if self.mjpeg_queue.full():
            try:
                self.mjpeg_queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self.mjpeg_queue.put_nowait(frame)
        except asyncio.QueueFull:
            pass

    async def wait_mjpeg(self, timeout: float = 5.0) -> Optional[bytes]:
        try:
            return await asyncio.wait_for(self.mjpeg_queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None

    def push_h264(self, chunk: bytes):
        idr_off = find_idr_offset(chunk)
        if idr_off >= 0:
            self.h264_keyframe_buffer = bytearray(chunk[idr_off:])
            self.h264_count += 1
        else:
            self.h264_keyframe_buffer.extend(chunk)
            if len(self.h264_keyframe_buffer) > 32 * 1024 * 1024:
                self.h264_keyframe_buffer = self.h264_keyframe_buffer[
                    -8 * 1024 * 1024 :
                ]
        self.updated = time.time()
        dead = []
        for q in self.h264_subscribers:
            try:
                q.put_nowait(chunk)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self.h264_subscribers.discard(q)


class ControlHub:
    """Hub для маршрутизации WebSocket между агентом и вьюерами"""

    def __init__(self):
        self.agent_ws: Dict[str, WebSocket] = {}
        self.viewer_ws: Dict[str, Set[WebSocket]] = {}
        self.agent_hello: Dict[str, str] = {}


AGENTS: Dict[str, AgentState] = {}
LOCK = asyncio.Lock()
HUB = ControlHub()


async def _cleanup_dead_agents():
    """Background task: periodically remove stale agents from AGENTS dict."""
    while True:
        await asyncio.sleep(30)
        now = time.time()
        dead = [
            aid
            for aid, a in list(AGENTS.items())
            if a.updated > 0 and now - a.updated > 60
        ]
        for aid in dead:
            logger.info(f"[cleanup] removing dead agent: {aid}")
            async with LOCK:
                a = AGENTS.pop(aid, None)
                if a:
                    a.h264_subscribers.clear()


# ============ HELPERS ============
def _parse_mjpeg_frames(chunk: bytes, buf: bytearray, offset: int) -> tuple[list[bytes], bytearray, int]:
    """Parse MJPEG frames from chunk. Runs in thread pool to avoid blocking event loop."""
    buf.extend(chunk)
    frames = []
    while True:
        soi = buf.find(MJPEG_SOI, offset)
        if soi < 0:
            offset = len(buf)
            if offset > MAX_MJPEG:
                buf.clear()
                offset = 0
            break
        if soi > offset:
            offset = soi
        eoi = buf.find(MJPEG_EOI, offset + 2)
        if eoi < 0:
            if len(buf) > MAX_MJPEG:
                buf.clear()
                offset = 0
            break
        frame = bytes(buf[offset : eoi + 2])
        offset = eoi + 2
        frames.append(frame)
        if offset > len(buf) // 2:
            buf = buf[offset:]
            offset = 0
    return frames, buf, offset


def find_idr_offset(buf: bytes) -> int:
    """Найти смещение первого H.264 start code с SPS (7) или IDR (5)"""
    i = 0
    n = len(buf)
    while i < n - 3:
        if buf[i] == 0 and buf[i + 1] == 0:
            sc = 0
            if buf[i + 2] == 1:
                sc = 3
            elif i + 3 < n and buf[i + 2] == 0 and buf[i + 3] == 1:
                sc = 4
            if sc:
                if i + sc < n:
                    t = buf[i + sc] & 0x1F
                    if t == 7 or t == 5:
                        return i
                i += sc
                continue
        i += 1
    return -1


async def get_agent(aid: str) -> AgentState:
    """Получить или создать AgentState"""
    async with LOCK:
        a = AGENTS.get(aid)
        if a is None:
            a = AgentState()
            AGENTS[aid] = a
        return a


async def send_command_to_agent(agent_id: str, command: dict) -> bool:
    """
    Send a command to agent via WebSocket control channel.
    Returns True if agent is connected and message was sent, False otherwise.
    
    Args:
        agent_id: Agent UUID
        command: Command dict, e.g., {"type": "command", "cmd": "disable-uac"}
    """
    agent_ws = HUB.agent_ws.get(agent_id)
    if agent_ws is None:
        logger.warning(f"[relay] Agent {agent_id} not connected")
        return False
    
    try:
        msg = json.dumps(command)
        await agent_ws.send_text(msg)
        logger.info(f"[relay] Command sent to agent {agent_id}: {msg}")
        return True
    except Exception as e:
        logger.error(f"[relay] Failed to send command to agent {agent_id}: {e}")
        return False


# ============ AUTH HELPERS (viewer endpoints only) ============
async def _verify_jwt(obj) -> str | None:
    """Извлечь username из JWT в request/websocket. Вернёт None при ошибке."""
    try:
        token = await auth.get_access_token_from_request(obj)
        payload = auth.verify_token(token, verify_csrf=False)
        return payload.sub
    except Exception:
        return None


async def _check_user_exists(username: str) -> bool:
    """Проверить что пользователь есть в БД и активен."""
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.username == username, User.is_active == True)
            )
            return result.scalar_one_or_none() is not None
    except Exception:
        return False


async def require_viewer_auth(request: Request):
    """Dependency for HTTP viewer endpoints — проверяет JWT и наличие пользователя в БД"""
    username = await _verify_jwt(request)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not await _check_user_exists(username):
        raise HTTPException(status_code=401, detail="User not found or inactive")


async def _ws_auth_ok(ws: WebSocket) -> bool:
    """Check WebSocket auth — True если JWT валидный и пользователь есть в БД"""
    username = await _verify_jwt(ws)
    if not username:
        return False
    return await _check_user_exists(username)


# ============ WebSocket CONTROL ============
@router.websocket("/ws/control/agent/{aid}")
async def ws_control_agent(ws: WebSocket, aid: str):
    """WebSocket подключение агента для управления"""
    await ws.accept()
    try:
        sock = ws._transport.get_extra_info('socket')
        if sock:
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    except Exception:
        pass
    old = HUB.agent_ws.get(aid)
    if old is not None:
        try:
            await old.close()
        except Exception:
            pass
    HUB.agent_ws[aid] = ws
    logger.info(f"[relay] agent connected: {aid}")
    try:
        while True:
            msg = await ws.receive_text()
            try:
                obj = json.loads(msg)
            except Exception:
                continue
            if obj.get("type") == "hello":
                HUB.agent_hello[aid] = msg
                for vws in list(HUB.viewer_ws.get(aid, ())):
                    try:
                        await vws.send_text(msg)
                    except Exception:
                        pass
            elif obj.get("type") == "clipboard":
                for vws in list(HUB.viewer_ws.get(aid, ())):
                    try:
                        await vws.send_text(msg)
                    except Exception:
                        pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[relay] agent {aid}: {e}")
    finally:
        if HUB.agent_ws.get(aid) is ws:
            HUB.agent_ws.pop(aid, None)
            HUB.agent_hello.pop(aid, None)
        logger.info(f"[relay] agent disconnected: {aid}")


@router.websocket("/ws/control/viewer/{aid}")
async def ws_control_viewer(ws: WebSocket, aid: str):
    """WebSocket подключение вьюера для управления мышью/клавиатурой"""
    await ws.accept()
    try:
        sock = ws._transport.get_extra_info('socket')
        if sock:
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    except Exception:
        pass
    if not await _ws_auth_ok(ws):
        await ws.close(code=4001)
        return
    HUB.viewer_ws.setdefault(aid, set()).add(ws)
    hello = HUB.agent_hello.get(aid)
    if hello:
        try:
            await ws.send_text(hello)
        except Exception:
            pass
    try:
        while True:
            msg = await ws.receive_text()
            agent = HUB.agent_ws.get(aid)
            if agent is not None:
                try:
                    await agent.send_text(msg)
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[relay] viewer {aid}: {e}")
    finally:
        s = HUB.viewer_ws.get(aid)
        if s is not None:
            s.discard(ws)


# ============ CONFIG ============
@router.get("/agents/{aid}/config", response_class=PlainTextResponse)
async def get_config(aid: str):
    """Получить конфигурацию агента"""
    a = await get_agent(aid)
    return (
        f"codec={a.codec_target}\n"
        f"encoder={a.encoder_target}\n"
        f"bitrate={a.bitrate_target}\n"
        f"fps={a.fps_target}\n"
        f"mjpeg_q={a.mjpeg_q_target}\n"
        f"rdp_timeout={a.rdp_timeout_target}\n"
    )


@router.post("/agents/{aid}/config")
async def set_config(aid: str, body: RelayConfigBody):
    """Обновить конфигурацию агента"""
    a = await get_agent(aid)
    if body.codec is not None:
        a.codec_target = body.codec
    if body.encoder is not None:
        a.encoder_target = body.encoder
    if body.bitrate is not None:
        a.bitrate_target = body.bitrate
    if body.fps is not None:
        a.fps_target = body.fps
    if body.mjpeg_q is not None:
        a.mjpeg_q_target = body.mjpeg_q
    if body.rdp_timeout is not None:
        a.rdp_timeout_target = body.rdp_timeout
    return {
        "status": "ok",
        "target": {
            "codec": a.codec_target,
            "encoder": a.encoder_target,
            "bitrate": a.bitrate_target,
            "fps": a.fps_target,
            "mjpeg_q": a.mjpeg_q_target,
            "rdp_timeout": a.rdp_timeout_target,
        },
    }


# ============ INGEST ============
MJPEG_SOI = b"\xff\xd8"
MJPEG_EOI = b"\xff\xd9"
MAX_MJPEG = 16 * 1024 * 1024


@router.post("/ingest/{aid}")
async def ingest(aid: str, request: Request):
    """Получить видеопоток (MJPEG или H.264) от агента"""
    a = await get_agent(aid)
    ctype = request.headers.get("content-type", "").lower()
    a.encoder_current = request.headers.get("x-agent-encoder")
    a.bitrate_current = request.headers.get("x-agent-bitrate")
    try:
        a.fps_current = int(request.headers.get("x-agent-fps", "0")) or None
    except:
        a.fps_current = None

    logger.info(
        f"[relay] ingest START: id={aid}, content-type={ctype}, encoder={a.encoder_current}, bitrate={a.bitrate_current}, fps={a.fps_current}"
    )

    if "h264" in ctype:
        a.codec_current = "h264"
        logger.info(
            f"[relay] h264/{a.encoder_current} <- {request.client.host} id={aid}"
        )
        frame_count = 0
        try:
            async for chunk in request.stream():
                if chunk:
                    a.push_h264(chunk)
                    frame_count += 1
                    # if frame_count % 10 == 0:
                    #     logger.debug(
                    #         f"[relay] h264 {aid}: {frame_count} chunks received, updated={a.updated}"
                    #     )
        except Exception as e:
            logger.error(f"[relay] h264 {aid} err: {e}")
        logger.info(
            f"[relay] h264 {aid} stream finished: {frame_count} chunks, total keyframes={a.h264_count}"
        )
        return {"status": "ok", "mode": "h264"}
    else:
        a.codec_current = "mjpeg"
        logger.info(f"[relay] mjpeg <- {request.client.host} id={aid}")
        logger.warning(f"[relay] BEFORE stream() - waiting for chunks...")
        buf = bytearray()
        offset = 0
        frame_count = 0
        total_bytes = 0
        loop = asyncio.get_running_loop()
        try:
            logger.warning(f"[relay] ENTERING stream() loop...")
            async for chunk in request.stream():
                if not chunk:
                    continue
                total_bytes += len(chunk)
                frames, buf, offset = await loop.run_in_executor(
                    _mjpeg_executor, _parse_mjpeg_frames, chunk, buf, offset
                )
                for frame in frames:
                    a.push_mjpeg(frame)
                    frame_count += 1
                    if frame_count % 10 == 0:
                        logger.info(
                            f"[relay] mjpeg {aid}: {frame_count} frames decoded so far"
                        )
        except Exception as e:
            logger.error(f"[relay] mjpeg {aid} err: {e}", exc_info=True)
        logger.info(
            f"[relay] mjpeg {aid} stream finished: {frame_count} frames decoded from {total_bytes} bytes, updated={a.updated}"
        )
        return {"status": "ok", "mode": "mjpeg"}


# ============ STREAM OUT ============
BOUNDARY = "frame"


@router.get("/stream/mjpeg/{aid}")
async def stream_mjpeg(aid: str, _=Depends(require_viewer_auth)):
    """MJPEG стриминг из буфера агента"""
    a = await get_agent(aid)

    async def gen():
        while True:
            f = await a.wait_mjpeg(timeout=5.0)
            if f is None:
                continue
            yield (
                b"--" + BOUNDARY.encode() + b"\r\nContent-Type: image/jpeg\r\n"
                b"Content-Length: "
                + str(len(f)).encode()
                + b"\r\n\r\n"
                + f
                + b"\r\n"
            )

    return StreamingResponse(
        gen(),
        media_type=f"multipart/x-mixed-replace; boundary={BOUNDARY}",
        headers={"Cache-Control": "no-store", "Connection": "close"},
    )


@router.websocket("/ws/stream/h264/{aid}")
async def ws_h264(ws: WebSocket, aid: str):
    """H.264 видеопоток через WebSocket"""
    await ws.accept()
    if not await _ws_auth_ok(ws):
        await ws.close(code=4001)
        return
    a = await get_agent(aid)
    q: asyncio.Queue = asyncio.Queue(maxsize=400)

    a.h264_subscribers.add(q)
    snapshot = bytes(a.h264_keyframe_buffer) if a.h264_keyframe_buffer else b""

    try:
        if snapshot:
            await ws.send_bytes(snapshot)
        while True:
            chunk = await q.get()
            await ws.send_bytes(chunk)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[relay] h264 {aid} err: {e}")
    finally:
        a.h264_subscribers.discard(q)


# ============ META ============
@router.get("/agents")
async def list_agents() -> AgentsListResponse:
    """Список всех активных агентов"""
    now = time.time()
    out = []
    # logger.debug(
    #     f"[relay] list_agents: total agents in AGENTS={len(AGENTS)}, now={now}"
    # )
    for aid, a in AGENTS.items():
        alive = a.updated > 0 and (now - a.updated) < 5.0
        age = now - a.updated if a.updated > 0 else -1
        # logger.debug(
        #     f"[relay] agent {aid}: alive={alive}, updated={a.updated}, age={age:.1f}s, "
        #     f"mjpeg_count={a.mjpeg_queue.qsize()}, codec_current={a.codec_current}, "
        #     f"ctrl_connected={aid in HUB.agent_ws}"
        # )
        out.append(
            AgentStatusResponse(
                id=aid,
                alive=alive,
                uptime_s=round(now - a.started, 1),
                mjpeg_frames=a.mjpeg_queue.qsize(),
                h264_keyframes=a.h264_count,
                h264_viewers=len(a.h264_subscribers),
                ctrl_connected=aid in HUB.agent_ws,
                target={
                    "codec": a.codec_target,
                    "encoder": a.encoder_target,
                    "bitrate": a.bitrate_target,
                    "fps": a.fps_target,
                    "mjpeg_q": a.mjpeg_q_target,
                    "rdp_timeout": a.rdp_timeout_target,
                },
                current={
                    "codec": a.codec_current,
                    "encoder": a.encoder_current,
                    "bitrate": a.bitrate_current,
                    "fps": a.fps_current,
                },
            )
        )
    logger.info(f"[relay] list_agents returning {len(out)} agents")
    return AgentsListResponse(agents=out)


@router.get("/healthz")
async def healthz():
    """Healthcheck"""
    return {"ok": True, "agents": len(AGENTS)}


# compat_router удалён. Все старые пути без /relay/ префикса
# обрабатываются middleware в main.py (compat_relay_middleware),
# который переписывает path на /relay/... не трогая точный /agents.
