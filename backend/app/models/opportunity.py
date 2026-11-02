from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    source_identifier = Column(String(255), unique=True, index=True, nullable=True) # Benzersiz kayıt anahtarı / URL hash
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)  # TÜBİTAK, TEKNOFEST, vb.
    summary = Column(Text, nullable=True)               # Kısa ve açıklayıcı özet
    category = Column(String(100), nullable=False)     # "TÜBİTAK", "TEKNOFEST", "Yarışma", "Hackathon", "Burs", "Mühendislik"
    fields = Column(String(255), nullable=True)        # "Yapay Zekâ, Web, Siber Güvenlik, Robotik"
    target_audience = Column(String(255), nullable=True) # "Ön Lisans, Lisans, Lisansüstü"
    application_type = Column(String(50), default="both", nullable=False) # "individual", "team", "both"
    requirements = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)         # Son başvuru tarihi
    published_date = Column(DateTime, nullable=True)   # İlanın yayımlandığı tarih
    prize_support = Column(String(255), nullable=True) # Destek veya ödül tutarı
    official_url = Column(String(500), nullable=False) # Resmî duyuru bağlantısı
    application_url = Column(String(500), nullable=True) # Doğrudan başvuru bağlantısı (mevcutsa)
    last_verified_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_checked_at = Column(DateTime, default=datetime.utcnow, nullable=False) # Kaynağın son kontrol tarihi
    status = Column(String(50), default="open", nullable=False) # "open", "upcoming", "closed", "pending_verification"
    is_sample = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    favorites = relationship("OpportunityFavorite", back_populates="opportunity", cascade="all, delete-orphan")
    trackings = relationship("OpportunityTracking", back_populates="opportunity", cascade="all, delete-orphan")


class OpportunityFavorite(Base):
    __tablename__ = "opportunity_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="uq_user_opportunity_favorite"),
    )

    user = relationship("User", back_populates="favorite_opportunities")
    opportunity = relationship("Opportunity", back_populates="favorites")


class OpportunityTracking(Base):
    __tablename__ = "opportunity_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="examining", nullable=False) # "examining", "preparing", "applied", "completed", "abandoned"
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="uq_user_opportunity_tracking"),
    )

    user = relationship("User", back_populates="tracked_opportunities")
    opportunity = relationship("Opportunity", back_populates="trackings")


class OpportunitySyncLog(Base):
    __tablename__ = "opportunity_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False) # "success", "warning", "error"
    items_checked = Column(Integer, default=0, nullable=False)
    items_updated = Column(Integer, default=0, nullable=False)
    message = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ProjectIdea(Base):
    __tablename__ = "project_ideas"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # "TÜBİTAK 2209-A", "TEKNOFEST", "Bitirme Projesi", "Hackathon"
    required_skills = Column(String(500), nullable=False) # "React, Python, OpenCV"
    status = Column(String(50), default="open", nullable=False) # "open", "closed"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_projects")
    applications = relationship("ProjectTeamApplication", back_populates="project", cascade="all, delete-orphan")


class ProjectTeamApplication(Base):
    __tablename__ = "project_team_applications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project_ideas.id", ondelete="CASCADE"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # "pending", "accepted", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("project_id", "applicant_id", name="uq_project_team_applicant"),
    )

    project = relationship("ProjectIdea", back_populates="applications")
    applicant = relationship("User")


class GuideArticle(Base):
    __tablename__ = "guide_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    target_audience = Column(String(255), nullable=True) # "Tüm Seviyeler", "Lisans ve Ön Lisans"
    content = Column(Text, nullable=False)
    checklist_items = Column(Text, nullable=True) # JSON listesi
    template_example = Column(Text, nullable=True) # Doldurulabilir şablon metni
    official_sources = Column(Text, nullable=True) # Resmî kurum kaynak bağlantıları
    read_time_minutes = Column(Integer, default=5, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
