from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.academic import CourseBase, TopicOut

class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    uploader_id: int
    course_id: int
    topic_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    file_name: str
    file_size: int
    mime_type: str
    file_extension: str
    download_count: int
    is_flagged: bool
    sha256_hash: Optional[str] = None
    scan_status: str = "clean"
    security_note: Optional[str] = None
    created_at: datetime
    uploader_name: Optional[str] = None
    course: Optional[CourseBase] = None
    topic: Optional[TopicOut] = None

class ContentReportCreate(BaseModel):
    reason: str
    details: Optional[str] = None

class ContentReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reporter_id: int
    material_id: int
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime
    reporter_name: Optional[str] = None
    material_title: Optional[str] = None
