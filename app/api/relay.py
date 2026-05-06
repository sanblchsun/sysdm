# app/api/relay.py
# Stream relay: MJPEG + H.264, управление мышью через WebSocket
import asyncio
import time
import json
from typing import Dict, Optional, Set

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, PlainTextResponse
from loguru import logger

from app.schemas.relay import RelayConfigBody, AgentsListResponse, AgentStatusResponse

router = APIRouter(prefix="/relay", tags=["relay"])


# ============ MODELS ============
class AgentState:
    """Состояние агента и его потоков"""

    __slots__ = (
        "codec_target",
        "encoder_target",
        "bitrate_target",
        "fps_target",
        "mjpeg_q_target",
        "codec_current",
        "encoder_current",
        "bitrate_current",
        "fps_current",
        "mjpeg_latest",
        "mjpeg_count",
        "_mjpeg_event",
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

        self.codec_current: Optional[str] = None
        self.encoder_current: Optional[str] = None
        self.bitrate_current: Optional[str] = None
        self.fps_current: Optional[int] = None

        self.mjpeg_latest: Optional[bytes] = None
        self.mjpeg_count: int = 0
        self._mjpeg_event = asyncio.Event()

        self.h264_keyframe_buffer = bytearray()
        self.h264_subscribers: Set[asyncio.Queue] = set()
        self.h264_count: int = 0

        self.updated: float = 0.0
        self.started: float = time.time()

    def push_mjpeg(self, frame: bytes):
        self.mjpeg_latest = frame
        self.mjpeg_count += 1
        self.updated = time.time()
        ev = self._mjpeg_event
        self._mjpeg_event = asyncio.Event()
        ev.set()

    async def wait_mjpeg(self, timeout: float = 5.0) -> bool:
        try:
            await asyncio.wait_for(self._mjpeg_event.wait(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

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


# ============ HELPERS ============
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


# ============ WebSocket CONTROL ============
@router.websocket("/ws/control/agent/{aid}")
async def ws_control_agent(ws: WebSocket, aid: str):
    """WebSocket подключение агента для управления"""
    await ws.accept()
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
    return {
        "status": "ok",
        "target": {
            "codec": a.codec_target,
            "encoder": a.encoder_target,
            "bitrate": a.bitrate_target,
            "fps": a.fps_target,
            "mjpeg_q": a.mjpeg_q_target,
        },
    }


# ============ INGEST ============
MJPEG_SOI = b"\xff\xd8"
MJPEG_EOI = b"\xff\xd9"
MAX_MJPEG = 16 * 1024 * 1024


@router.post("/ingest/{aid}")
async def ingest(aid: str, request: Request):
    """Получить видеопоток (MJPEG или H.264) от агента"""
    logger.critical(f"[relay] ===== INGEST CALLED FOR {aid} =====")
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
                    if frame_count % 10 == 0:
                        logger.debug(
                            f"[relay] h264 {aid}: {frame_count} chunks received, updated={a.updated}"
                        )
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
        frame_count = 0
        total_bytes = 0
        try:
            logger.warning(f"[relay] ENTERING stream() loop...")
            async for chunk in request.stream():
                if not chunk:
                    continue
                total_bytes += len(chunk)
                logger.debug(
                    f"[relay] mjpeg {aid}: received chunk size={len(chunk)}, total_bytes={total_bytes}"
                )
                buf.extend(chunk)
                logger.debug(f"[relay] mjpeg {aid}: buf.size={len(buf)}")
                while True:
                    soi = buf.find(MJPEG_SOI)
                    if soi < 0:
                        logger.debug(
                            f"[relay] mjpeg {aid}: no SOI found in buf, buf size={len(buf)}"
                        )
                        buf.clear()
                        break
                    if soi > 0:
                        logger.debug(
                            f"[relay] mjpeg {aid}: SOI at offset {soi}, skipping {soi} bytes"
                        )
                        del buf[:soi]
                    eoi = buf.find(MJPEG_EOI, 2)
                    if eoi < 0:
                        logger.debug(
                            f"[relay] mjpeg {aid}: no EOI found after SOI, buf size={len(buf)}"
                        )
                        if len(buf) > MAX_MJPEG:
                            logger.warning(
                                f"[relay] mjpeg {aid}: buf too large ({len(buf)}), clearing"
                            )
                            buf.clear()
                        break
                    frame = bytes(buf[: eoi + 2])
                    del buf[: eoi + 2]
                    a.push_mjpeg(frame)
                    frame_count += 1
                    logger.debug(
                        f"[relay] mjpeg {aid}: decoded frame #{frame_count}, size={len(frame)}, updated={a.updated}"
                    )
                    if frame_count % 10 == 0:
                        logger.info(
                            f"[relay] mjpeg {aid}: {frame_count} frames decoded so far"
                        )
        except Exception as e:
            logger.error(f"[relay] mjpeg {aid} err: {e}", exc_info=True)
        logger.info(
            f"[relay] mjpeg {aid} stream finished: {frame_count} frames decoded from {total_bytes} bytes, total mjpeg_count={a.mjpeg_count}, updated={a.updated}"
        )
        return {"status": "ok", "mode": "mjpeg"}


# ============ STREAM OUT ============
BOUNDARY = "frame"


@router.get("/stream/mjpeg/{aid}")
async def stream_mjpeg(aid: str):
    """MJPEG стриминг из буфера агента"""
    a = await get_agent(aid)

    async def gen():
        last = -1
        if a.mjpeg_latest is None:
            await a.wait_mjpeg(timeout=10.0)
        while True:
            if a.mjpeg_count != last and a.mjpeg_latest is not None:
                last = a.mjpeg_count
                f = a.mjpeg_latest
                yield (
                    b"--" + BOUNDARY.encode() + b"\r\nContent-Type: image/jpeg\r\n"
                    b"Content-Length: "
                    + str(len(f)).encode()
                    + b"\r\n\r\n"
                    + f
                    + b"\r\n"
                )
            else:
                await a.wait_mjpeg(timeout=5.0)

    return StreamingResponse(
        gen(),
        media_type=f"multipart/x-mixed-replace; boundary={BOUNDARY}",
        headers={"Cache-Control": "no-store", "Connection": "close"},
    )


@router.websocket("/ws/stream/h264/{aid}")
async def ws_h264(ws: WebSocket, aid: str):
    """H.264 видеопоток через WebSocket"""
    await ws.accept()
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
    logger.debug(
        f"[relay] list_agents: total agents in AGENTS={len(AGENTS)}, now={now}"
    )
    for aid, a in AGENTS.items():
        alive = a.updated > 0 and (now - a.updated) < 5.0
        age = now - a.updated if a.updated > 0 else -1
        logger.debug(
            f"[relay] agent {aid}: alive={alive}, updated={a.updated}, age={age:.1f}s, "
            f"mjpeg_count={a.mjpeg_count}, codec_current={a.codec_current}, "
            f"ctrl_connected={aid in HUB.agent_ws}"
        )
        out.append(
            AgentStatusResponse(
                id=aid,
                alive=alive,
                uptime_s=round(now - a.started, 1),
                mjpeg_frames=a.mjpeg_count,
                h264_keyframes=a.h264_count,
                h264_viewers=len(a.h264_subscribers),
                ctrl_connected=aid in HUB.agent_ws,
                target={
                    "codec": a.codec_target,
                    "encoder": a.encoder_target,
                    "bitrate": a.bitrate_target,
                    "fps": a.fps_target,
                    "mjpeg_q": a.mjpeg_q_target,
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


# ============ BACKWARD COMPATIBILITY ROUTES (без /relay/ префикса) ============
# Для агента, который ещё не переведён на новые пути с /relay/ префиксом
# Все эти маршруты прокидывают запросы к основным эндпойнтам relay

compat_router = APIRouter(tags=["relay-compat"])


@compat_router.get("/agents/{aid}/config", response_class=PlainTextResponse)
async def compat_get_config(aid: str):
    """[COMPAT] Получить конфигурацию агента (прокси к /relay/agents/{aid}/config)"""
    a = await get_agent(aid)
    return (
        f"codec={a.codec_target}\n"
        f"encoder={a.encoder_target}\n"
        f"bitrate={a.bitrate_target}\n"
        f"fps={a.fps_target}\n"
        f"mjpeg_q={a.mjpeg_q_target}\n"
    )


@compat_router.post("/agents/{aid}/config")
async def compat_set_config(aid: str, body: RelayConfigBody):
    """[COMPAT] Обновить конфигурацию агента (прокси к /relay/agents/{aid}/config)"""
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
    return {
        "status": "ok",
        "target": {
            "codec": a.codec_target,
            "encoder": a.encoder_target,
            "bitrate": a.bitrate_target,
            "fps": a.fps_target,
            "mjpeg_q": a.mjpeg_q_target,
        },
    }


@compat_router.post("/ingest/{aid}")
async def compat_ingest(aid: str, request: Request):
    """[COMPAT] Получить видеопоток от агента (прокси к /relay/ingest/{aid})"""
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
        logger.info(
            f"[relay-compat] h264/{a.encoder_current} <- {request.client.host} id={aid}"
        )
        try:
            async for chunk in request.stream():
                if chunk:
                    a.push_h264(chunk)
        except Exception as e:
            logger.error(f"[relay-compat] h264 {aid} err: {e}")
        return {"status": "ok", "mode": "h264"}
    else:
        a.codec_current = "mjpeg"
        logger.info(f"[relay-compat] mjpeg <- {request.client.host} id={aid}")
        buf = bytearray()
        try:
            async for chunk in request.stream():
                if not chunk:
                    continue
                buf.extend(chunk)
                while True:
                    soi = buf.find(MJPEG_SOI)
                    if soi < 0:
                        buf.clear()
                        break
                    if soi > 0:
                        del buf[:soi]
                    eoi = buf.find(MJPEG_EOI, 2)
                    if eoi < 0:
                        if len(buf) > MAX_MJPEG:
                            buf.clear()
                        break
                    frame = bytes(buf[: eoi + 2])
                    del buf[: eoi + 2]
                    a.push_mjpeg(frame)
        except Exception as e:
            logger.error(f"[relay-compat] mjpeg {aid} err: {e}")
        return {"status": "ok", "mode": "mjpeg"}


@compat_router.get("/agents")
async def compat_list_agents() -> AgentsListResponse:
    """[COMPAT] Список всех активных агентов (прокси к /relay/agents)"""
    now = time.time()
    out = []
    for aid, a in AGENTS.items():
        alive = a.updated > 0 and (now - a.updated) < 5.0
        out.append(
            AgentStatusResponse(
                id=aid,
                alive=alive,
                uptime_s=round(now - a.started, 1),
                mjpeg_frames=a.mjpeg_count,
                h264_keyframes=a.h264_count,
                h264_viewers=len(a.h264_subscribers),
                ctrl_connected=aid in HUB.agent_ws,
                target={
                    "codec": a.codec_target,
                    "encoder": a.encoder_target,
                    "bitrate": a.bitrate_target,
                    "fps": a.fps_target,
                    "mjpeg_q": a.mjpeg_q_target,
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


@compat_router.websocket("/ws/control/agent/{aid}")
async def compat_ws_control_agent(ws: WebSocket, aid: str):
    """[COMPAT] WebSocket подключение агента для управления (прокси к /relay/ws/control/agent/{aid})"""
    await ws.accept()
    old = HUB.agent_ws.get(aid)
    if old is not None:
        try:
            await old.close()
        except Exception:
            pass
    HUB.agent_ws[aid] = ws
    logger.info(f"[relay-compat] agent connected: {aid}")
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
        logger.error(f"[relay-compat] agent {aid}: {e}")
    finally:
        if HUB.agent_ws.get(aid) is ws:
            HUB.agent_ws.pop(aid, None)
            HUB.agent_hello.pop(aid, None)
        logger.info(f"[relay-compat] agent disconnected: {aid}")
