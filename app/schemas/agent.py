# app/schemas/agent.py
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import re


class AgentBase(BaseModel):
    hostname: str = Field(..., min_length=1, max_length=255)
    local_ip: str = Field(
        ...,
        pattern=r'^(\d{1,3}\.){3}\d{1,3}$',  # Используем pattern вместо regex
        description="IPv4 address"
    )
    operating_system: Optional[str] = None
    platform: Optional[str] = None
    cpu_model: Optional[str] = None
    total_ram: Optional[int] = None
    disk_space: Optional[Dict[str, Any]] = None

    @validator('local_ip')
    def validate_ip_address(cls, v):
        """Дополнительная валидация IP адреса"""
        parts = v.split('.')
        if len(parts) != 4:
            raise ValueError('Invalid IP address format')

        for part in parts:
            if not 0 <= int(part) <= 255:
                raise ValueError('Each IP octet must be between 0 and 255')

        return v


class AgentCreate(AgentBase):
    agent_id: str = Field(..., min_length=1, max_length=100)
    site_id: Optional[str] = None
    public_ip: Optional[str] = None
    mac_address: Optional[str] = None
    architecture: Optional[str] = None
    cpu_cores: Optional[int] = None
    department: Optional[str] = None
    description: Optional[str] = None

    @validator('public_ip', pre=True, always=True)
    def validate_public_ip(cls, v):
        if v and v != "":
            # Простая валидация IPv4
            ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
            if not re.match(ip_pattern, v):
                raise ValueError('Invalid public IP address format')

            # Проверяем диапазоны
            parts = v.split('.')
            for part in parts:
                if not 0 <= int(part) <= 255:
                    raise ValueError('Each IP octet must be between 0 and 255')

        return v

    @validator('mac_address')
    def validate_mac_address(cls, v):
        if v and v != "":
            # Разрешаем форматы: 00:11:22:33:44:55 или 00-11-22-33-44-55
            mac_pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
            if not re.match(mac_pattern, v):
                raise ValueError('Invalid MAC address format. Use format like: 00:11:22:33:44:55 or 00-11-22-33-44-55')
        return v


class AgentUpdate(BaseModel):
    is_online: Optional[bool] = None
    last_seen: Optional[datetime] = None
    public_ip: Optional[str] = None
    agent_version: Optional[str] = None
    notes: Optional[str] = None
    description: Optional[str] = None


class AgentInDB(AgentBase):
    id: int
    agent_id: str
    site_id: Optional[str]
    public_ip: Optional[str]
    mac_address: Optional[str]
    architecture: Optional[str]
    cpu_cores: Optional[int]
    is_online: bool
    last_seen: Optional[datetime]
    agent_version: str
    department: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True  # Заменяет orm_mode в Pydantic v2


class AgentResponse(AgentInDB):
    pass