from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_type = Column(String(50), nullable=False)  # "focus", "short_break", "long_break"
    planned_duration = Column(Integer, nullable=False)  # in seconds
    actual_duration = Column(Integer, nullable=False)   # in seconds
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=True, nullable=False)
    tag = Column(String(120), nullable=True)
    client_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="pomodoro_sessions")
