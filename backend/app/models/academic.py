from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "CS201"
    name = Column(String(255), nullable=False)  # e.g., "Veri Yapıları ve Algoritmalar"
    description = Column(Text, nullable=True)
    faculty = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    student_preferences = relationship("StudentCoursePreference", back_populates="course", cascade="all, delete-orphan")
    materials = relationship("StudyMaterial", back_populates="course", cascade="all, delete-orphan")
    study_groups = relationship("StudyGroup", back_populates="course", cascade="all, delete-orphan")
    support_requests = relationship("SupportRequest", back_populates="course")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    course = relationship("Course", back_populates="topics")
    materials = relationship("StudyMaterial", back_populates="topic")


class StudentCoursePreference(Base):
    __tablename__ = "student_course_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    preference_type = Column(String(50), nullable=False)  # "teach", "learn", "both"
    topics_list = Column(Text, nullable=True)  # Comma-separated or JSON list of topics they can teach/need help with
    description = Column(Text, nullable=True)
    mode_preference = Column(String(50), default="both")  # "online", "in_person", "both"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_preference"),
    )

    user = relationship("User", back_populates="course_preferences")
    course = relationship("Course", back_populates="student_preferences")


class StudentAvailability(Base):
    __tablename__ = "student_availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(50), nullable=False)  # Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar
    start_time = Column(String(10), nullable=False)  # "14:00"
    end_time = Column(String(10), nullable=False)    # "16:00"
    mode = Column(String(50), default="both")        # "online", "in_person", "both"

    user = relationship("User", back_populates="availabilities")
