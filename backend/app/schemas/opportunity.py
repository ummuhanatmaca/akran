from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class OpportunityBase(BaseModel):
    title: str
    organization: str
    summary: Optional[str] = None
    category: str
    fields: Optional[str] = None
    target_audience: Optional[str] = None
    application_type: Optional[str] = "both"
    requirements: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    published_date: Optional[datetime] = None
    prize_support: Optional[str] = None
    official_url: str
    application_url: Optional[str] = None
    status: Optional[str] = "open"
    is_sample: Optional[bool] = False

class OpportunityCreate(OpportunityBase):
    source_identifier: Optional[str] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[str] = None
    target_audience: Optional[str] = None
    application_type: Optional[str] = None
    requirements: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    published_date: Optional[datetime] = None
    prize_support: Optional[str] = None
    official_url: Optional[str] = None
    application_url: Optional[str] = None
    status: Optional[str] = None
    is_sample: Optional[bool] = None

class OpportunityOut(OpportunityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_identifier: Optional[str] = None
    last_verified_date: datetime
    last_checked_at: Optional[datetime] = None
    created_at: datetime
    is_favorited: Optional[bool] = False
    tracking_status: Optional[str] = None

class OpportunitySyncLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_name: str
    status: str
    items_checked: int
    items_updated: int
    message: Optional[str] = None
    checked_at: datetime

class OpportunityTrackingUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class OpportunityTrackingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    opportunity_id: int
    status: str
    notes: Optional[str] = None
    updated_at: datetime
    opportunity: Optional[OpportunityOut] = None

class ProjectIdeaCreate(BaseModel):
    title: str
    description: str
    category: str
    required_skills: str

class ProjectTeamAppCreate(BaseModel):
    message: str

class ProjectTeamAppOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    applicant_id: int
    message: str
    status: str
    created_at: datetime
    applicant_name: Optional[str] = None
    applicant_department: Optional[str] = None

class ProjectIdeaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int
    title: str
    description: str
    category: str
    required_skills: str
    status: str
    created_at: datetime
    creator_name: Optional[str] = None
    applications: List[ProjectTeamAppOut] = []

class GuideArticleBase(BaseModel):
    title: str
    slug: str
    category: str
    summary: str
    target_audience: Optional[str] = "Tüm Seviyeler"
    content: str
    checklist_items: Optional[str] = None
    template_example: Optional[str] = None
    official_sources: Optional[str] = None
    read_time_minutes: Optional[int] = 5

class GuideArticleCreate(GuideArticleBase):
    pass

class GuideArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    target_audience: Optional[str] = None
    content: Optional[str] = None
    checklist_items: Optional[str] = None
    template_example: Optional[str] = None
    official_sources: Optional[str] = None
    read_time_minutes: Optional[int] = None

class GuideArticleOut(GuideArticleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    updated_at: Optional[datetime] = None
    created_at: datetime
