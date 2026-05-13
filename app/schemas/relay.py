# app/schemas/relay.py
from pydantic import BaseModel, Field


class RelayConfigBody(BaseModel):
    """Конфигурация кодека и параметров для агента"""

    codec: str | None = Field(None, pattern="^(mjpeg|h264)$")
    encoder: str | None = Field(None, pattern="^(cpu|amf|qsv|nvenc)$")
    bitrate: str | None = Field(None, pattern=r"^\d+[KMkm]?$")
    fps: int | None = Field(None, ge=1, le=120)
    mjpeg_q: int | None = Field(None, ge=2, le=31)
    rdp_timeout: int | None = Field(None, ge=1, le=1440)


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
    elapsed: float = 0.0


class AgentsListResponse(BaseModel):
    """Список всех активных агентов"""

    agents: list[AgentStatusResponse]
