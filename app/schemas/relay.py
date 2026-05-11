# app/schemas/relay.py
from typing import Optional
from pydantic import BaseModel, Field


class RelayConfigBody(BaseModel):
    """Конфигурация кодека и параметров для агента"""

    codec: Optional[str] = Field(None, pattern="^(mjpeg|h264)$")
    encoder: Optional[str] = Field(None, pattern="^(cpu|amf|qsv|nvenc)$")
    bitrate: Optional[str] = Field(None, pattern=r"^\d+[KMkm]?$")
    fps: Optional[int] = Field(None, ge=1, le=120)
    mjpeg_q: Optional[int] = Field(None, ge=2, le=31)
    rdp_timeout: Optional[int] = Field(None, ge=1, le=1440)


class AgentConfigResponse(BaseModel):
    """Ответ с текущей конфигурацией агента"""

    codec: str
    encoder: str
    bitrate: str
    fps: int
    mjpeg_q: int


class AgentStatusResponse(BaseModel):
    """Статус одного агента в relay"""

    id: str
    alive: bool
    uptime_s: float
    mjpeg_frames: int
    h264_keyframes: int
    h264_viewers: int
    ctrl_connected: bool
    target: dict
    current: dict


class AgentsListResponse(BaseModel):
    """Список всех активных агентов"""

    agents: list[AgentStatusResponse]
