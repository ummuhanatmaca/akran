from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class LearningGoal(Base):
    __tablename__ = "learning_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="in_progress", nullable=False)  # "in_progress", "completed", "abandoned"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="learning_goals")
    course = relationship("Course")
