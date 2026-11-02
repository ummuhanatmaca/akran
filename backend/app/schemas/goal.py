from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.academic import CourseBase

class LearningGoalCreate(BaseModel):
    course_id: int
    topic: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None

class LearningGoalUpdate(BaseModel):
    topic: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None

class LearningGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    course_id: int
    topic: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime
    course: Optional[CourseBase] = None
