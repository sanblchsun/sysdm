# app/api/relay.py
# Stream relay: MJPEG + H.264, управление мышью через WebSocket
import asyncio
import concurrent.futures
import os
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
from app.redis_client import get_redis

router = APIRouter(prefix="/relay", tags=["relay"])
_mjpeg_executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

REDIS_AGENT_KEY = "agent:config:{aid}"
REDIS_AGENT_TTL = 86400
REDIS_HELLO_KEY = "agent:hello:{aid}"
REDIS_WORKER_KEY = "agent:worker:{aid}"
REDIS_AGENT_CONFIG_CHANNEL = "agent:config"

WORKER_ID = os.environ.get("HOSTNAME", f"worker-{os.getpid()}")


class PubSubManager:
    """Redis Pub/Sub — кросс-воркер обмен для ControlHub и видео.
    Каждый worker подписывается на ctrl:* и video:* при старте.
    """

    def __init__(self):
        self._pubsub = None
        self._task = None
        self._pubsub_conn = None

    async def start(self):
        from app.redis_client import get_redis
        r = await get_redis()
        self._pubsub_conn = r
        self._pubsub = r.pubsub()
        await self._pubsub.psubscribe("ctrl:*", "video:*")
        self._task = asyncio.create_task(self._run())
        logger.info(f"[pubsub] worker={WORKER_ID} subscribed to ctrl:* video:*")

    async def _run(self):
        ps = self._pubsub
        if ps is None:
            return
        while True:
            try:
                async for msg in ps.listen():
                    if msg["type"] != "pmessage":
                        continue
                    await self._dispatch(msg)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(1)

    async def _dispatch(self, msg):
        channel = msg["channel"]
        data = msg["data"]
        if isinstance(channel, bytes):
            channel = channel.decode()

        if channel.startswith("ctrl:to:"):
            # Commands to MAIN process (stop-rdp, disable-uac, etc)
            aid = channel[8:]
            ws = HUB.agent_ws.get(aid)
            if ws:
                try:
                    text = data.decode() if isinstance(data, bytes) else data
                    await ws.send_text(text)
                except Exception:
                    pass

        elif channel.startswith("ctrl:worker:"):
            # Commands to WORKER process (mouse, keyboard, etc)
            aid = channel[12:]
            ws = HUB.worker_ws.get(aid)
            if ws:
                try:
                    text = data.decode() if isinstance(data, bytes) else data
                    await ws.send_text(text)
                except Exception:
                    pass

        elif channel.startswith("ctrl:from:"):
            aid = channel[10:]
            viewers = HUB.viewer_ws.get(aid, set())
            for vws in list(viewers):
                try:
                    text = data.decode() if isinstance(data, bytes) else data
                    await vws.send_text(text)
                except Exception:
                    pass

        elif channel.startswith("video:mjpeg:"):
            aid = channel[12:]
            try:
                async with LOCK:
                    a = AGENTS.get(aid)
                if a:
                    frame = data if isinstance(data, bytes) else data.encode()
                    a.push_mjpeg(frame)
            except Exception:
                pass

        elif channel.startswith("video:h264:"):
            aid = channel[11:]
            try:
                async with LOCK:
                    a = AGENTS.get(aid)
                if a:
                    chunk = data if isinstance(data, bytes) else data.encode()
                    a.push_h264(chunk)
            except Exception:
                pass

    async def publish(self, channel: str, message):
        if self._pubsub_conn:
            try:
                await self._pubsub_conn.publish(channel, message)
            except Exception:
                pass

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._pubsub:
            await self._pubsub.close()


# ============ MODELS ============
class AgentState:
    """Состояние агента и его потоков.
    Скалярные поля дублируются в Redis для multi-worker.
    Видеобуферы (mjpeg, h264) только локально.
    """

    __slots__ = (
        "aid",
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
        "h264_total_count",
        "mjpeg_total_count",
        "updated",
        "started",
        "_last_redis_sync",
        "_worker_id",
    )

    def __init__(self, aid: str):
        self.aid = aid
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
        self.h264_total_count: int = 0  # Cumulative keyframe counter (only grows)
        self.mjpeg_total_count: int = 0  # Cumulative MJPEG frame counter (only grows)

        self.updated: float = 0.0
        self.started: float = time.time()
        self._last_redis_sync: float = 0.0
        self._worker_id: str = WORKER_ID

    async def load_from_redis(self):
        r = await get_redis()
        key = REDIS_AGENT_KEY.format(aid=self.aid)
        data = await r.hgetall(key)  # type: ignore[misc]
        if not data:
            self.updated = time.time()
            return
        self.codec_target = data.get("codec_target", self.codec_target)
        self.encoder_target = data.get("encoder_target", self.encoder_target)
        self.bitrate_target = data.get("bitrate_target", self.bitrate_target)
        self.fps_target = int(data.get("fps_target", self.fps_target))
        self.mjpeg_q_target = int(data.get("mjpeg_q_target", self.mjpeg_q_target))
        self.rdp_timeout_target = int(data.get("rdp_timeout_target", self.rdp_timeout_target))
        self.started = float(data.get("started", self.started))
        upd = data.get("updated")
        if upd:
            parsed = float(upd)
            self.updated = parsed if time.time() - parsed < 60 else time.time()
        else:
            self.updated = time.time()
        self.codec_current = data.get("codec_current") or None
        self.encoder_current = data.get("encoder_current") or None
        self.bitrate_current = data.get("bitrate_current") or None
        fps = data.get("fps_current")
        self.fps_current = int(fps) if fps else None

    async def persist_runtime(self):
        r = await get_redis()
        key = REDIS_AGENT_KEY.format(aid=self.aid)
        await r.hset(key, mapping={  # type: ignore[misc]
            "codec_current": self.codec_current or "",
            "encoder_current": self.encoder_current or "",
            "bitrate_current": self.bitrate_current or "",
            "fps_current": str(self.fps_current) if self.fps_current else "",
            "updated": str(self.updated),
        })
        await r.expire(key, REDIS_AGENT_TTL)

    async def persist_config(self, changed: dict):
        r = await get_redis()
        key = REDIS_AGENT_KEY.format(aid=self.aid)
        if changed:
            await r.hset(key, mapping=changed)  # type: ignore[misc]
            await r.expire(key, REDIS_AGENT_TTL)

    def push_mjpeg(self, frame: bytes):
        self.updated = time.time()
        self.mjpeg_total_count += 1  # Increment cumulative counter
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
            self.h264_total_count += 1  # Increment cumulative counter
        else:
            self.h264_keyframe_buffer.extend(chunk)
            if len(self.h264_keyframe_buffer) > 32 * 1024 * 1024:
                self.h264_keyframe_buffer = self.h264_keyframe_buffer[-8 * 1024 * 1024:]
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
    def __init__(self):
        self.agent_ws: Dict[str, WebSocket] = {}      # Main process (commands)
        self.worker_ws: Dict[str, WebSocket] = {}     # Worker process (mouse/keyboard)
        self.viewer_ws: Dict[str, Set[WebSocket]] = {}
        self.agent_hello: Dict[str, str] = {}


AGENTS: Dict[str, AgentState] = {}
LOCK = asyncio.Lock()
HUB = ControlHub()
PS_MANAGER = PubSubManager()


async def _cleanup_dead_agents():
    """Background task: periodically remove stale agents from AGENTS dict and Redis."""
    while True:
        await asyncio.sleep(30)
        now = time.time()
        dead = [
            aid for aid, a in list(AGENTS.items())
            if a.updated > 0 and now - a.updated > 60
        ]
        if not dead:
            continue
        r = await get_redis()
        for aid in dead:
            key = REDIS_AGENT_KEY.format(aid=aid)
            redis_upd = await r.hget(key, "updated")  # type: ignore[misc]
            if redis_upd and time.time() - float(redis_upd) < 120:
                continue
            logger.info(f"[cleanup] removing dead agent: {aid}")
            async with LOCK:
                a = AGENTS.pop(aid, None)
                if a:
                    a.h264_subscribers.clear()
            await r.delete(key)
            await r.delete(REDIS_WORKER_KEY.format(aid=aid))


# ============ HELPERS ============
def _parse_mjpeg_frames(chunk: bytes, buf: bytearray, offset: int) -> tuple[list[bytes], bytearray, int]:
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
        frame = bytes(buf[offset: eoi + 2])
        offset = eoi + 2
        frames.append(frame)
        if offset > len(buf) // 2:
            del buf[:offset]
            offset = 0
    return frames, buf, offset


def find_idr_offset(buf: bytes) -> int:
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
    """Get or create agent state with proper locking"""
    async with LOCK:
        a = AGENTS.get(aid)
        if a is not None:
            return a
        
        # Agent not in cache, create new one
        a = AgentState(aid)
        try:
            await a.load_from_redis()
        except Exception:
            pass
        AGENTS[aid] = a
        return a


async def send_command_to_agent(agent_id: str, command: dict) -> bool:
    agent_ws = HUB.agent_ws.get(agent_id)
    if agent_ws is not None:
        try:
            msg = json.dumps(command)
            await agent_ws.send_text(msg)
            return True
        except Exception:
            return False
    try:
        r = await get_redis()
        worker = await r.get(REDIS_WORKER_KEY.format(aid=agent_id))
        if not worker:
            return False
    except Exception:
        pass
    try:
        msg = json.dumps(command)
        await PS_MANAGER.publish(f"ctrl:to:{agent_id}", msg)
        return True
    except Exception:
        return False


# ============ AUTH HELPERS ============
async def _verify_jwt(obj) -> str | None:
    try:
        token = await auth.get_access_token_from_request(obj)
        payload = auth.verify_token(token, verify_csrf=False)
        return payload.sub
    except Exception:
        return None


async def _check_user_exists(username: str) -> bool:
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.username == username, User.is_active == True)
            )
            return result.scalar_one_or_none() is not None
    except Exception:
        return False


async def require_viewer_auth(request: Request):
    username = await _verify_jwt(request)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not await _check_user_exists(username):
        raise HTTPException(status_code=401, detail="User not found or inactive")


async def _ws_auth_ok(ws: WebSocket) -> bool:
    username = await _verify_jwt(ws)
    if not username:
        return False
    return await _check_user_exists(username)


# ============ WebSocket CONTROL ============
@router.websocket("/ws/control/agent/{aid}")
async def ws_control_agent(ws: WebSocket, aid: str):
    await ws.accept()
    try:
        sock = ws._transport.get_extra_info('socket')  # type: ignore[attr-defined]
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
    try:
        r = await get_redis()
        await r.set(REDIS_WORKER_KEY.format(aid=aid), WORKER_ID, ex=60)
    except Exception:
        pass
    logger.info(f"[relay] agent connected: {aid} worker={WORKER_ID}")
    try:
        while True:
            msg = await ws.receive_text()
            try:
                obj = json.loads(msg)
            except Exception:
                continue
            if obj.get("type") == "hello":
                HUB.agent_hello[aid] = msg
                try:
                    r = await get_redis()
                    await r.set(REDIS_HELLO_KEY.format(aid=aid), msg, ex=300)
                except Exception:
                    pass
                await PS_MANAGER.publish(f"ctrl:from:{aid}", msg)
            elif obj.get("type") == "clipboard":
                await PS_MANAGER.publish(f"ctrl:from:{aid}", msg)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if HUB.agent_ws.get(aid) is ws:
            HUB.agent_ws.pop(aid, None)
            HUB.agent_hello.pop(aid, None)
            try:
                r = await get_redis()
                await r.delete(REDIS_WORKER_KEY.format(aid=aid))
            except Exception:
                pass
        logger.info(f"[relay] agent disconnected: {aid} worker={WORKER_ID}")


@router.websocket("/ws/control/worker/{aid}")
async def ws_control_worker(ws: WebSocket, aid: str):
    """Worker process connection - for mouse/keyboard commands"""
    await ws.accept()
    try:
        sock = ws._transport.get_extra_info('socket')  # type: ignore[attr-defined]
        if sock:
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    except Exception:
        pass
    
    # Register worker for mouse/keyboard commands
    old = HUB.worker_ws.get(aid)
    if old is not None:
        try:
            await old.close()
        except Exception:
            pass
    HUB.worker_ws[aid] = ws
    
    logger.info(f"[relay] worker connected: {aid} worker={WORKER_ID}")
    try:
        while True:
            msg = await ws.receive_text()
            # Worker sends log/status messages, forward to status channel only
            try:
                obj = json.loads(msg)
                if obj.get("type") == "status":
                    # Publish worker status to browsers
                    await PS_MANAGER.publish(f"worker:status:{aid}", msg)
            except Exception:
                pass
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if HUB.worker_ws.get(aid) is ws:
            HUB.worker_ws.pop(aid, None)
        logger.info(f"[relay] worker disconnected: {aid}")


@router.websocket("/ws/control/viewer/{aid}")
async def ws_control_viewer(ws: WebSocket, aid: str):
    await ws.accept()
    try:
        sock = ws._transport.get_extra_info('socket')  # type: ignore[attr-defined]
        if sock:
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    except Exception:
        pass
    if not await _ws_auth_ok(ws):
        await ws.close(code=4001)
        return
    HUB.viewer_ws.setdefault(aid, set()).add(ws)
    hello = HUB.agent_hello.get(aid)
    if not hello:
        try:
            r = await get_redis()
            hello = await r.get(REDIS_HELLO_KEY.format(aid=aid))
        except Exception:
            pass
    if hello:
        try:
            await ws.send_text(hello)
        except Exception:
            pass
    try:
        while True:
            msg = await ws.receive_text()
            try:
                obj = json.loads(msg)
                msg_type = obj.get("type", "")
                
                # Mouse/keyboard/clipboard go to WORKER
                if msg_type in ("mouse_move", "mouse_down", "mouse_up", "mouse_wheel", 
                               "text", "key_down", "key_up", "clipboard"):
                    # Direct relay if worker is on the same server — avoids Redis PubSub latency
                    ws_worker = HUB.worker_ws.get(aid)
                    if ws_worker is not None:
                        try:
                            await ws_worker.send_text(msg)
                        except Exception:
                            await PS_MANAGER.publish(f"ctrl:worker:{aid}", msg)
                    else:
                        await PS_MANAGER.publish(f"ctrl:worker:{aid}", msg)
                # Commands (stop-rdp, disable-uac, etc) go to MAIN
                elif msg_type == "command":
                    await PS_MANAGER.publish(f"ctrl:to:{aid}", msg)
                else:
                    # Unknown message type, send to main for safety
                    await PS_MANAGER.publish(f"ctrl:to:{aid}", msg)
            except Exception:
                # Malformed JSON - send to main as-is
                await PS_MANAGER.publish(f"ctrl:to:{aid}", msg)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        s = HUB.viewer_ws.get(aid)
        if s is not None:
            s.discard(ws)
        logger.info(f"[relay] viewer disconnected: {aid}")


# ============ CONFIG ============
@router.get("/agents/{aid}/config", response_class=PlainTextResponse)
async def get_config(aid: str):
    a = await get_agent(aid)
    return (
        f"codec={a.codec_target}\n"
        f"encoder={a.encoder_target}\n"
        f"bitrate={a.bitrate_target}\n"
        f"fps={a.fps_target}\n"
        f"mjpeg_q={a.mjpeg_q_target}\n"
        f"rdp_timeout={a.rdp_timeout_target}\n"
    )


def _build_agent_status_dict(a) -> dict:
    now = time.time()
    alive = a.updated > 0 and (now - a.updated) < 30.0
    ctrl_local = a.aid in HUB.agent_ws
    return {
        "id": a.aid,
        "alive": alive,
        "elapsed": round(now - a.updated, 1) if a.updated > 0 else 999.0,
        "uptime_s": round(now - a.started, 1),
        "mjpeg_frames": a.mjpeg_total_count,
        "h264_keyframes": a.h264_total_count,
        "h264_viewers": len(a.h264_subscribers),
        "ctrl_connected": ctrl_local,
        "target": {
            "codec": a.codec_target,
            "encoder": a.encoder_target,
            "bitrate": a.bitrate_target,
            "fps": a.fps_target,
            "mjpeg_q": a.mjpeg_q_target,
            "rdp_timeout": a.rdp_timeout_target,
        },
        "current": {
            "codec": a.codec_current,
            "encoder": a.encoder_current,
            "bitrate": a.bitrate_current,
            "fps": a.fps_current,
        },
    }


@router.post("/agents/{aid}/config")
async def set_config(aid: str, body: RelayConfigBody):
    a = await get_agent(aid)
    changed = {}
    if body.codec is not None:
        a.codec_target = body.codec
        changed["codec_target"] = body.codec
    if body.encoder is not None:
        a.encoder_target = body.encoder
        changed["encoder_target"] = body.encoder
    if body.bitrate is not None:
        a.bitrate_target = body.bitrate
        changed["bitrate_target"] = body.bitrate
    if body.fps is not None:
        a.fps_target = body.fps
        changed["fps_target"] = str(body.fps)
    if body.mjpeg_q is not None:
        a.mjpeg_q_target = body.mjpeg_q
        changed["mjpeg_q_target"] = str(body.mjpeg_q)
    if body.rdp_timeout is not None:
        a.rdp_timeout_target = body.rdp_timeout
        changed["rdp_timeout_target"] = str(body.rdp_timeout)
    if changed:
        try:
            await a.persist_config(changed)
        except Exception:
            pass
        try:
            ws = HUB.worker_ws.get(aid)
            if ws:
                config_msg = json.dumps({
                    "type": "config",
                    "codec": a.codec_target,
                    "encoder": a.encoder_target,
                    "bitrate": a.bitrate_target,
                    "fps": a.fps_target,
                    "mjpeg_q": a.mjpeg_q_target,
                    "rdp_timeout": a.rdp_timeout_target,
                })
                await ws.send_text(config_msg)
        except Exception:
            pass
        try:
            r = await get_redis()
            await r.publish(REDIS_AGENT_CONFIG_CHANNEL, json.dumps(_build_agent_status_dict(a)))
        except Exception:
            pass
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
    a = await get_agent(aid)
    ctype = request.headers.get("content-type", "").lower()
    a.encoder_current = request.headers.get("x-agent-encoder")
    a.bitrate_current = request.headers.get("x-agent-bitrate")
    try:
        a.fps_current = int(request.headers.get("x-agent-fps", "0")) or None
    except:
        a.fps_current = None

    if "h264" in ctype:
        a.codec_current = "h264"
        a.updated = time.time()
        await a.persist_runtime()
        frame_count = 0
        try:
            async for chunk in request.stream():
                if chunk:
                    a.push_h264(chunk)
                    frame_count += 1
                    if frame_count % 300 == 0 and time.time() - a._last_redis_sync > 15:
                        a._last_redis_sync = time.time()
                        await a.persist_runtime()
        except Exception:
            pass
        logger.info(f"[relay] h264 {aid} stream finished: {frame_count} chunks, total keyframes={a.h264_count}")
        return {"status": "ok", "mode": "h264"}
    else:
        a.codec_current = "mjpeg"
        a.updated = time.time()
        await a.persist_runtime()
        buf = bytearray()
        offset = 0
        frame_count = 0
        total_bytes = 0
        loop = asyncio.get_running_loop()
        try:
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
                    if frame_count % 10 == 0 and time.time() - a._last_redis_sync > 15:
                        a._last_redis_sync = time.time()
                        await a.persist_runtime()
        except Exception:
            pass
        logger.info(f"[relay] mjpeg {aid} stream finished: {frame_count} frames decoded from {total_bytes} bytes")
        return {"status": "ok", "mode": "mjpeg"}


# ============ STREAM OUT ============
BOUNDARY = "frame"


@router.get("/stream/mjpeg/{aid}")
async def stream_mjpeg(aid: str, _=Depends(require_viewer_auth)):
    a = await get_agent(aid)

    async def gen():
        while True:
            f = await a.wait_mjpeg(timeout=5.0)
            if f is None:
                continue
            yield (
                b"--" + BOUNDARY.encode() + b"\r\nContent-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(f)).encode() + b"\r\n\r\n"
                + f + b"\r\n"
            )

    return StreamingResponse(
        gen(),
        media_type=f"multipart/x-mixed-replace; boundary={BOUNDARY}",
        headers={"Cache-Control": "no-store", "Connection": "close"},
    )


@router.websocket("/ws/stream/h264/{aid}")
async def ws_h264(ws: WebSocket, aid: str):
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
    except Exception:
        pass
    finally:
        a.h264_subscribers.discard(q)


# ============ META ============
@router.get("/agents")
async def list_agents() -> AgentsListResponse:
    now = time.time()
    out = []

    # Collect from local cache + Redis (with proper locking)
    async with LOCK:
        agent_ids: set = set(AGENTS.keys())
    
    # Also scan Redis for agents not in local cache
    try:
        r = await get_redis()
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match="agent:config:*", count=100)
            for key in keys:
                aid = key.decode() if isinstance(key, bytes) else key
                aid = aid.split(":", 2)[-1]
                agent_ids.add(aid)
            if cursor == 0:
                break
    except Exception:
        pass

    for aid in agent_ids:
        async with LOCK:
            a = AGENTS.get(aid)
        
        if a is None:
            try:
                async with LOCK:
                    # Double-check pattern to avoid race condition
                    a = AGENTS.get(aid)
                    if a is not None:
                        pass
                    else:
                        a = AgentState(aid)
                        await a.load_from_redis()
                        AGENTS[aid] = a
            except Exception:
                continue

        alive = a.updated > 0 and (now - a.updated) < 30.0
        elapsed = now - a.updated if a.updated > 0 else 999.0
        ctrl_local = aid in HUB.agent_ws
        ctrl_any = ctrl_local
        if not ctrl_any:
            try:
                r = await get_redis()
                worker_val = await r.get(REDIS_WORKER_KEY.format(aid=aid))
                ctrl_any = worker_val is not None
            except Exception:
                pass
        out.append(
            AgentStatusResponse(
                id=aid,
                alive=alive,
                elapsed=round(elapsed, 1),
                uptime_s=round(now - a.started, 1),
                mjpeg_frames=a.mjpeg_total_count,
                h264_keyframes=a.h264_total_count,
                h264_viewers=len(a.h264_subscribers),
                ctrl_connected=ctrl_any,
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
    return AgentsListResponse(agents=out)


@router.websocket("/ws/agent-status-sync")
async def ws_agent_status_sync(websocket: WebSocket):
    """WebSocket for real-time agent online/offline status sync via Redis Pub/Sub
    
    Frontend connects to receive real-time status updates from agent heartbeats.
    Server subscribes to Redis 'agent:status' channel and forwards updates to client.
    """
    await websocket.accept()
    
    r = await get_redis()
    pubsub = r.pubsub()
    try:
        await pubsub.subscribe("agent:status")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode()
                    await websocket.send_text(data)
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe("agent:status")
        await pubsub.close()


@router.websocket("/ws/agent-config-sync")
async def ws_agent_config_sync(websocket: WebSocket):
    """WebSocket for real-time agent config/status updates for the RDP dashboard"""
    await websocket.accept()
    r = await get_redis()
    pubsub = r.pubsub()
    try:
        await pubsub.subscribe(REDIS_AGENT_CONFIG_CHANNEL)
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode()
                    await websocket.send_text(data)
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(REDIS_AGENT_CONFIG_CHANNEL)
        await pubsub.close()




# compat_router удалён. Старые пути без /relay/ префикса
# обрабатываются middleware в main.py, который не трогает точный /agents.