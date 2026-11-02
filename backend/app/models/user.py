from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # "student", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    course_preferences = relationship("StudentCoursePreference", back_populates="user", cascade="all, delete-orphan")
    availabilities = relationship("StudentAvailability", back_populates="user", cascade="all, delete-orphan")
    requested_supports = relationship("SupportRequest", foreign_keys="SupportRequest.requester_id", back_populates="requester")
    given_supports = relationship("SupportRequest", foreign_keys="SupportRequest.helper_id", back_populates="helper")
    materials = relationship("StudyMaterial", back_populates="uploader", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    learning_goals = relationship("LearningGoal", back_populates="user", cascade="all, delete-orphan")
    favorite_opportunities = relationship("OpportunityFavorite", back_populates="user", cascade="all, delete-orphan")
    tracked_opportunities = relationship("OpportunityTracking", back_populates="user", cascade="all, delete-orphan")
    group_memberships = relationship("StudyGroupMember", back_populates="user", cascade="all, delete-orphan")
    created_groups = relationship("StudyGroup", back_populates="creator", cascade="all, delete-orphan")
    created_projects = relationship("ProjectIdea", back_populates="creator", cascade="all, delete-orphan")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    university = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    grade = Column(String(50), nullable=False)  # Hazırlık, 1. Sınıf, 2. Sınıf, 3. Sınıf, 4. Sınıf, Yüksek Lisans
    bio = Column(Text, nullable=True)
    interests = Column(String(500), nullable=True)  # Comma-separated or tag list
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")
