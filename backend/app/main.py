import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.db.seed import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.courses import router as courses_router
from app.api.support import router as support_router
from app.api.materials import router as materials_router
from app.api.study_groups import router as study_groups_router
from app.api.opportunities import router as opportunities_router
from app.api.goals import router as goals_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router
from app.api.pomodoro import router as pomodoro_router

import asyncio
from app.core.database import SessionLocal
from app.services.opportunity_verifier import verify_and_sync_opportunities

async def periodic_opportunity_verifier():
    while True:
        try:
            interval_sec = max(300, settings.OPPORTUNITY_CHECK_INTERVAL_HOURS * 3600)
            await asyncio.sleep(interval_sec)
            if settings.OPPORTUNITY_AUTO_CHECK_ENABLED:
                db = SessionLocal()
                try:
                    verify_and_sync_opportunities(db)
                finally:
                    db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Periodic opportunity verification error: {e}")
            await asyncio.sleep(60)

from app.core.database import ensure_database_schema

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and verify schema
    Base.metadata.create_all(bind=engine)
    try:
        ensure_database_schema(engine)
    except Exception as e:
        print(f"Startup schema notice: {e}")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")

    task = None
    if settings.OPPORTUNITY_AUTO_CHECK_ENABLED:
        task = asyncio.create_task(periodic_opportunity_verifier())

    yield

    if task:
        task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Üniversite Öğrencileri İçin Ücretsiz Akademik Destek ve Bilgi Paylaşım Platformu API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    for o in cors_env.split(","):
        clean_o = o.strip()
        if clean_o and clean_o not in origins:
            origins.append(clean_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?:\/\/(localhost|.*\.vercel\.app|.*\.netlify\.app|.*\.onrender\.com)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(support_router, prefix="/api")
app.include_router(materials_router, prefix="/api")
app.include_router(study_groups_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(pomodoro_router, prefix="/api")

@app.get("/api/health", tags=["Sağlık Kontrolü"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "production" if not os.getenv("DEBUG") else "development"
    }

@app.get("/")
def root():
    return {
        "message": "AKRAN API Sistemine Hoş Geldiniz.",
        "documentation": "/docs"
    }
