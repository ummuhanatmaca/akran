from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)  # original uploaded name
    file_data = Column(LargeBinary, nullable=True)   # Kalıcı veritabanı depolaması (Render ephemeral disk koruması)
    file_size = Column(Integer, nullable=False)      # in bytes
    mime_type = Column(String(100), nullable=False)
    file_extension = Column(String(20), nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    sha256_hash = Column(String(64), nullable=True)
    scan_status = Column(String(30), default="clean", nullable=False)  # "clean", "quarantined", "suspicious"
    security_note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    uploader = relationship("User", back_populates="materials")
    course = relationship("Course", back_populates="materials")
    topic = relationship("Topic", back_populates="materials")
    reports = relationship("ContentReport", back_populates="material", cascade="all, delete-orphan")


class ContentReport(Base):
    __tablename__ = "content_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(100), nullable=False)  # "copyright", "inappropriate", "spam", "wrong_content", "other"
    details = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # "pending", "reviewed", "dismissed", "removed"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reporter = relationship("User")
    material = relationship("StudyMaterial", back_populates="reports")
