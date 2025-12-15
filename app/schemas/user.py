import re
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
    password: str = Field(..., min_length=12)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Must contain at least one special character')
        return v

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