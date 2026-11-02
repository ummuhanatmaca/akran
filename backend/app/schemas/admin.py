from pydantic import BaseModel
from typing import Optional

class AdminStatsOut(BaseModel):
    total_users: int
    active_users: int
    total_support_requests: int
    completed_sessions: int
    total_materials: int
    active_opportunities: int
    pending_reports: int

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
