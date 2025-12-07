from pydantic import BaseModel, Field, field_validator
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v and v != "" and '@' not in v:
            raise ValueError('Invalid email format')
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_admin: bool

    model_config = {
        "from_attributes": True  # Для Pydantic v2
    }

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"