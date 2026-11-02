from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, time
from app.core.database import get_db
from app.models.user import User
from app.models.pomodoro import PomodoroSession
from app.schemas.pomodoro import (
    PomodoroSessionCreate,
    PomodoroSessionOut,
    PomodoroStatsOut,
    PomodoroSyncRequest,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/pomodoro", tags=["Pomodoro ve Odaklanma"])

@router.get("/sessions", response_model=List[PomodoroSessionOut])
def get_my_pomodoro_sessions(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının geçmiş Pomodoro oturumlarını getirir."""
    sessions = (
        db.query(PomodoroSession)
        .filter(PomodoroSession.user_id == current_user.id)
        .order_by(PomodoroSession.started_at.desc())
        .limit(limit)
        .all()
    )
    return sessions

@router.post("/sessions", response_model=PomodoroSessionOut, status_code=status.HTTP_201_CREATED)
def create_pomodoro_session(
    data: PomodoroSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yeni bir Pomodoro veya mola oturumu kaydeder."""
    # Mükerrer kaydı önlemek için client_id kontrolü
    if data.client_id:
        existing = db.query(PomodoroSession).filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.client_id == data.client_id
        ).first()
        if existing:
            return existing

    session = PomodoroSession(
        user_id=current_user.id,
        session_type=data.session_type,
        planned_duration=data.planned_duration,
        actual_duration=data.actual_duration,
        started_at=data.started_at,
        ended_at=data.ended_at,
        completed=data.completed,
        tag=data.tag.strip() if data.tag else None,
        client_id=data.client_id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/sync", status_code=status.HTTP_200_OK)
def sync_offline_sessions(
    data: PomodoroSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Misafir modundayken yerel tarayıcıda biriken oturumları sunucuya senkronize eder."""
    synced_count = 0
    for item in data.sessions:
        if item.client_id:
            existing = db.query(PomodoroSession).filter(
                PomodoroSession.user_id == current_user.id,
                PomodoroSession.client_id == item.client_id
            ).first()
            if existing:
                continue

        session = PomodoroSession(
            user_id=current_user.id,
            session_type=item.session_type,
            planned_duration=item.planned_duration,
            actual_duration=item.actual_duration,
            started_at=item.started_at,
            ended_at=item.ended_at,
            completed=item.completed,
            tag=item.tag.strip() if item.tag else None,
            client_id=item.client_id
        )
        db.add(session)
        synced_count += 1

    if synced_count > 0:
        db.commit()

    return {"message": "Senkronizasyon tamamlandı.", "synced_count": synced_count, "total_received": len(data.sessions)}

@router.get("/stats", response_model=PomodoroStatsOut)
def get_pomodoro_stats(
    daily_goal: int = Query(4, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının odaklanma istatistiklerini hesaplar."""
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), time.min)

    # Bugün tamamlanan odaklanma oturumları
    today_sessions = (
        db.query(PomodoroSession)
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.session_type == "focus",
            PomodoroSession.completed == True,
            PomodoroSession.started_at >= today_start
        )
        .all()
    )

    today_sessions_count = len(today_sessions)
    today_focus_seconds = sum(s.actual_duration for s in today_sessions)
    today_focus_minutes = today_focus_seconds // 60

    # Tüm zamanlar
    all_completed = (
        db.query(PomodoroSession)
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.session_type == "focus",
            PomodoroSession.completed == True
        )
        .all()
    )

    total_completed_pomodoros = len(all_completed)
    total_focus_seconds = sum(s.actual_duration for s in all_completed)
    total_focus_minutes = total_focus_seconds // 60

    progress_percent = min(100.0, round((today_sessions_count / daily_goal) * 100, 1))

    return PomodoroStatsOut(
        today_sessions_count=today_sessions_count,
        today_focus_minutes=today_focus_minutes,
        total_completed_pomodoros=total_completed_pomodoros,
        total_focus_minutes=total_focus_minutes,
        daily_goal=daily_goal,
        today_goal_progress_percent=progress_percent
    )

@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
def delete_pomodoro_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının kendi Pomodoro oturumunu silmesini sağlar."""
    session = db.query(PomodoroSession).filter(
        PomodoroSession.id == session_id,
        PomodoroSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Oturum kaydı bulunamadı.")

    db.delete(session)
    db.commit()
    return {"message": "Oturum kaydı silindi."}
