from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="En az 6 karakter olmalıdır")
    full_name: str = Field(..., min_length=2)
    university: str = Field(..., min_length=2)
    department: str = Field(..., min_length=2)
    grade: str = Field(..., min_length=1)  # 1. Sınıf, 2. Sınıf, vb.
    bio: Optional[str] = None
    interests: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="Yeni parola en az 8 karakter olmalıdır")
