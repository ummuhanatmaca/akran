from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.academic import CourseBase

class StudyGroupMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    group_id: int
    user_id: int
    role: str
    joined_at: datetime
    user_name: Optional[str] = None
    user_department: Optional[str] = None

class StudyGroupCreate(BaseModel):
    course_id: int
    title: str
    topic: str
    description: Optional[str] = None
    max_members: Optional[int] = 5
    mode: Optional[str] = "online"
    scheduled_at: Optional[datetime] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None

class StudyGroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int
    course_id: int
    title: str
    topic: str
    description: Optional[str] = None
    max_members: int
    mode: str
    scheduled_at: Optional[datetime] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    status: str
    created_at: datetime
    current_members_count: int = 1
    course: Optional[CourseBase] = None
    creator_name: Optional[str] = None
    members: List[StudyGroupMemberOut] = []
