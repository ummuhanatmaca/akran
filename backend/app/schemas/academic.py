from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    description: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class TopicOut(TopicBase):
    id: int
    course_id: int

class CourseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    code: str
    name: str
    description: Optional[str] = None
    faculty: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    created_at: datetime
    topics: List[TopicOut] = []

class CoursePreferenceCreate(BaseModel):
    course_id: int
    preference_type: str  # "teach", "learn", "both"
    topics_list: Optional[str] = None
    description: Optional[str] = None
    mode_preference: Optional[str] = "both"

class CoursePreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    course_id: int
    preference_type: str
    topics_list: Optional[str] = None
    description: Optional[str] = None
    mode_preference: str
    course: Optional[CourseBase] = None

class AvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    mode: Optional[str] = "both"

class AvailabilityOut(AvailabilityCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
