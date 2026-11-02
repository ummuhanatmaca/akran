from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    helper_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    preferred_schedule = Column(String(255), nullable=True)  # e.g., "Cumartesi öğleden sonra"
    mode = Column(String(50), default="online", nullable=False)  # "online", "in_person"
    status = Column(String(50), default="pending", nullable=False)  # "pending", "accepted", "rejected", "cancelled", "completed"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="requested_supports")
    helper = relationship("User", foreign_keys=[helper_id], back_populates="given_supports")
    course = relationship("Course", back_populates="support_requests")
    session = relationship("SupportSession", back_populates="request", uselist=False, cascade="all, delete-orphan")


class SupportSession(Base):
    __tablename__ = "support_sessions"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("support_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    tutor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(255), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)
    mode = Column(String(50), default="online", nullable=False)
    meeting_link = Column(String(500), nullable=True)
    status = Column(String(50), default="scheduled", nullable=False)  # "scheduled", "completed", "cancelled"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    request = relationship("SupportRequest", back_populates="session")
    tutor = relationship("User", foreign_keys=[tutor_id])
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course")
    reviews = relationship("SessionReview", back_populates="session", cascade="all, delete-orphan")


class SessionReview(Base):
    __tablename__ = "session_reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("support_sessions.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating_clarity = Column(Integer, default=5, nullable=False)  # 1-5
    rating_helpfulness = Column(Integer, default=5, nullable=False)  # 1-5
    rating_punctuality = Column(Integer, default=5, nullable=False)  # 1-5
    rating_overall = Column(Float, default=5.0, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("session_id", "reviewer_id", name="uq_session_reviewer"),
    )

    session = relationship("SupportSession", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
