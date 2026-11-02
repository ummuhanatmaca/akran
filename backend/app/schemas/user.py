from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    full_name: str
    university: str
    department: str
    grade: str
    bio: Optional[str] = None
    interests: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_public: bool

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_public: Optional[bool] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileOut] = None

class TutorSearchFilter(BaseModel):
    course_id: Optional[int] = None
    topic: Optional[str] = None
    mode: Optional[str] = None
    university: Optional[str] = None
