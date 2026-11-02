from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.academic import CourseBase

class SupportRequestCreate(BaseModel):
    helper_id: Optional[int] = None
    course_id: int
    topic_name: str
    description: Optional[str] = None
    preferred_schedule: Optional[str] = None
    mode: Optional[str] = "online"

class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    university: Optional[str] = None
    department: Optional[str] = None

class SupportRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    requester_id: int
    helper_id: Optional[int] = None
    course_id: int
    topic_name: str
    description: Optional[str] = None
    preferred_schedule: Optional[str] = None
    mode: str
    status: str
    created_at: datetime
    course: Optional[CourseBase] = None
    requester_name: Optional[str] = None
    helper_name: Optional[str] = None

class SupportSessionCreate(BaseModel):
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60
    mode: Optional[str] = "online"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class SupportSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_id: int
    course_id: int
    tutor_id: int
    student_id: int
    topic_name: str
    scheduled_at: datetime
    duration_minutes: int
    mode: str
    meeting_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    course: Optional[CourseBase] = None
    tutor_name: Optional[str] = None
    student_name: Optional[str] = None

class SessionReviewCreate(BaseModel):
    rating_clarity: int
    rating_helpfulness: int
    rating_punctuality: int
    comment: Optional[str] = None

class SessionReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    session_id: int
    reviewer_id: int
    reviewee_id: int
    rating_clarity: int
    rating_helpfulness: int
    rating_punctuality: int
    rating_overall: float
    comment: Optional[str] = None
    created_at: datetime
    reviewer_name: Optional[str] = None
