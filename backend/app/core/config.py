import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "AKRAN — Akademik Destek ve Bilgi Paylaşım Platformu"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "akran-super-secret-production-and-graduation-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Defaults to SQLite for local development without Docker, supports Postgres via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./akran.db")
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads")))
    MAX_FILE_SIZE: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg", ".docx"]
    
    # Admin Seed
    INITIAL_ADMIN_EMAIL: str = os.getenv("INITIAL_ADMIN_EMAIL", "admin@akran.edu.tr")
    INITIAL_ADMIN_PASSWORD: str = os.getenv("INITIAL_ADMIN_PASSWORD", "AdminAkran2026!")

    # Opportunity Verifier Settings
    OPPORTUNITY_CHECK_INTERVAL_HOURS: int = int(os.getenv("OPPORTUNITY_CHECK_INTERVAL_HOURS", "6"))
    OPPORTUNITY_AUTO_CHECK_ENABLED: bool = os.getenv("OPPORTUNITY_AUTO_CHECK_ENABLED", "True").lower() == "true"

settings = Settings()
