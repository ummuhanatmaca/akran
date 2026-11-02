from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    max_members = Column(Integer, default=5, nullable=False)
    mode = Column(String(50), default="online", nullable=False)  # "online", "in_person", "hybrid"
    scheduled_at = Column(DateTime, nullable=True)
    meeting_link = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(String(50), default="open", nullable=False)  # "open", "full", "completed", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_groups")
    course = relationship("Course", back_populates="study_groups")
    members = relationship("StudyGroupMember", back_populates="group", cascade="all, delete-orphan")


class StudyGroupMember(Base):
    __tablename__ = "study_group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member", nullable=False)  # "creator", "member"
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_study_group_member"),
    )

    group = relationship("StudyGroup", back_populates="members")
    user = relationship("User", back_populates="group_memberships")
