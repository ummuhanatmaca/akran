from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Literal
from datetime import datetime

class PomodoroSessionCreate(BaseModel):
    session_type: Literal["focus", "short_break", "long_break"]
    planned_duration: int = Field(ge=1, le=14400, description="Planlanan süre (saniye)")
    actual_duration: int = Field(ge=0, le=14400, description="Gerçekleşen süre (saniye)")
    started_at: datetime
    ended_at: datetime
    completed: bool = True
    tag: Optional[str] = Field(None, max_length=120)
    client_id: Optional[str] = Field(None, max_length=100)

class PomodoroSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    session_type: str
    planned_duration: int
    actual_duration: int
    started_at: datetime
    ended_at: datetime
    completed: bool
    tag: Optional[str] = None
    client_id: Optional[str] = None
    created_at: datetime

class PomodoroStatsOut(BaseModel):
    today_sessions_count: int
    today_focus_minutes: int
    total_completed_pomodoros: int
    total_focus_minutes: int
    daily_goal: int = 4
    today_goal_progress_percent: float

class PomodoroSyncRequest(BaseModel):
    sessions: List[PomodoroSessionCreate]
