from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.user import User, UserProfile
from app.models.academic import Course
from app.models.support import SupportRequest, SupportSession, SessionReview
from app.models.notification import Notification
from app.schemas.support import (
    SupportRequestCreate,
    SupportRequestOut,
    SupportSessionCreate,
    SupportSessionOut,
    SessionReviewCreate,
    SessionReviewOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/support", tags=["Akran Desteği ve Oturumlar"])

@router.post("/requests", response_model=SupportRequestOut, status_code=status.HTTP_201_CREATED)
def create_support_request(
    data: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    if data.helper_id and data.helper_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize ders talebi gönderemezsiniz.")

    req = SupportRequest(
        requester_id=current_user.id,
        helper_id=data.helper_id,
        course_id=data.course_id,
        topic_name=data.topic_name.strip(),
        description=data.description,
        preferred_schedule=data.preferred_schedule,
        mode=data.mode or "online",
        status="pending"
    )
    db.add(req)
    db.flush()

    # Create notification for helper if specified
    if data.helper_id:
        requester_name = current_user.profile.full_name if current_user.profile else "Bir öğrenci"
        notif = Notification(
            user_id=data.helper_id,
            title="Yeni Ders Desteği Talebi",
            message=f"{requester_name}, {course.name} dersinde '{data.topic_name}' konusu için sizden destek talep etti.",
            type="support_request",
            link="/support-requests"
        )
        db.add(notif)

    db.commit()
    db.refresh(req)

    return _format_support_request(req, db)

@router.get("/requests/sent", response_model=List[SupportRequestOut])
def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = (
        db.query(SupportRequest)
        .filter(SupportRequest.requester_id == current_user.id)
        .order_by(SupportRequest.created_at.desc())
        .all()
    )
    return [_format_support_request(r, db) for r in requests]

@router.get("/requests/received", response_model=List[SupportRequestOut])
def get_received_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = (
        db.query(SupportRequest)
        .filter(SupportRequest.helper_id == current_user.id)
        .order_by(SupportRequest.created_at.desc())
        .all()
    )
    return [_format_support_request(r, db) for r in requests]

@router.put("/requests/{request_id}/status")
def update_request_status(
    request_id: int,
    status_action: str, # "accept", "reject", "cancel"
    scheduled_at: Optional[datetime] = None,
    meeting_link: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(SupportRequest).filter(SupportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı.")

    # Authorization
    is_helper = req.helper_id == current_user.id
    is_requester = req.requester_id == current_user.id

    if not is_helper and not is_requester:
        raise HTTPException(status_code=403, detail="Bu talebi güncelleme yetkiniz yok.")

    if status_action == "accept":
        if not is_helper:
            raise HTTPException(status_code=403, detail="Yalnızca talebi alan kişi kabul edebilir.")
        if req.status != "pending":
            raise HTTPException(status_code=400, detail="Yalnızca bekleyen talepler kabul edilebilir.")

        req.status = "accepted"

        # Oturum tarihi belirle (parametre verilmemişse 2 gün sonraya varsayılan ata)
        session_time = scheduled_at or datetime.utcnow()
        session = SupportSession(
            request_id=req.id,
            course_id=req.course_id,
            tutor_id=req.helper_id,
            student_id=req.requester_id,
            topic_name=req.topic_name,
            scheduled_at=session_time,
            duration_minutes=60,
            mode=req.mode,
            meeting_link=meeting_link or "https://meet.google.com/new",
            status="scheduled"
        )
        db.add(session)

        # Notify requester
        tutor_name = current_user.profile.full_name if current_user.profile else "Ders anlatıcısı"
        db.add(Notification(
            user_id=req.requester_id,
            title="Ders Talebiniz Kabul Edildi",
            message=f"{tutor_name}, {req.topic_name} konulu destek talebinizi kabul etti. Oturum planlandı.",
            type="support_accepted",
            link="/sessions"
        ))

    elif status_action == "reject":
        if not is_helper:
            raise HTTPException(status_code=403, detail="Yalnızca talebi alan kişi reddedebilir.")
        req.status = "rejected"
        tutor_name = current_user.profile.full_name if current_user.profile else "Ders anlatıcısı"
        db.add(Notification(
            user_id=req.requester_id,
            title="Ders Talebi Yanıtı",
            message=f"{tutor_name}, şu an müsait olmadığı için talebinizi kabul edemedi.",
            type="support_rejected",
            link="/support-requests"
        ))

    elif status_action == "cancel":
        if not is_requester and not is_helper:
            raise HTTPException(status_code=403, detail="Yetkiniz yok.")
        req.status = "cancelled"

    db.commit()
    return {"message": f"Talep durumu '{req.status}' olarak güncellendi."}

# Sessions
@router.get("/sessions", response_model=List[SupportSessionOut])
def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(SupportSession)
        .filter((SupportSession.tutor_id == current_user.id) | (SupportSession.student_id == current_user.id))
        .order_by(SupportSession.scheduled_at.desc())
        .all()
    )
    return [_format_support_session(s, db) for s in sessions]

@router.put("/sessions/{session_id}/status")
def update_session_status(
    session_id: int,
    new_status: str, # "completed", "cancelled"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SupportSession).filter(SupportSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Oturum bulunamadı.")

    if current_user.id not in [session.tutor_id, session.student_id]:
        raise HTTPException(status_code=403, detail="Bu oturumu güncelleme yetkiniz yok.")

    if new_status not in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Geçersiz durum.")

    session.status = new_status
    db.commit()
    return {"message": f"Oturum durumu '{new_status}' olarak güncellendi."}

# Reviews
@router.post("/sessions/{session_id}/reviews", response_model=SessionReviewOut, status_code=status.HTTP_201_CREATED)
def create_session_review(
    session_id: int,
    data: SessionReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SupportSession).filter(SupportSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Oturum bulunamadı.")

    if current_user.id not in [session.tutor_id, session.student_id]:
        raise HTTPException(status_code=403, detail="Yalnızca oturuma katılanlar değerlendirme yapabilir.")

    # Check if already reviewed
    existing = db.query(SessionReview).filter(
        SessionReview.session_id == session_id,
        SessionReview.reviewer_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu oturum için zaten değerlendirme yaptınız.")

    # Target of review
    reviewee_id = session.tutor_id if current_user.id == session.student_id else session.student_id

    # Compute overall rating
    overall = round((data.rating_clarity + data.rating_helpfulness + data.rating_punctuality) / 3.0, 1)

    review = SessionReview(
        session_id=session_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating_clarity=data.rating_clarity,
        rating_helpfulness=data.rating_helpfulness,
        rating_punctuality=data.rating_punctuality,
        rating_overall=overall,
        comment=data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    rev_out = SessionReviewOut.model_validate(review)
    rev_out.reviewer_name = current_user.profile.full_name if current_user.profile else "Öğrenci"
    return rev_out

def _format_support_request(req: SupportRequest, db: Session) -> SupportRequestOut:
    out = SupportRequestOut.model_validate(req)
    req_user = db.query(User).filter(User.id == req.requester_id).first()
    out.requester_name = req_user.profile.full_name if req_user and req_user.profile else "Anonim"
    if req.helper_id:
        help_user = db.query(User).filter(User.id == req.helper_id).first()
        out.helper_name = help_user.profile.full_name if help_user and help_user.profile else "Anonim"
    return out

def _format_support_session(s: SupportSession, db: Session) -> SupportSessionOut:
    out = SupportSessionOut.model_validate(s)
    tutor = db.query(User).filter(User.id == s.tutor_id).first()
    student = db.query(User).filter(User.id == s.student_id).first()
    out.tutor_name = tutor.profile.full_name if tutor and tutor.profile else "Eğitmen"
    out.student_name = student.profile.full_name if student and student.profile else "Öğrenci"
    return out
