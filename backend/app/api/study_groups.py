from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Course
from app.models.study_group import StudyGroup, StudyGroupMember
from app.schemas.study_group import StudyGroupCreate, StudyGroupOut, StudyGroupMemberOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/study-groups", tags=["Çalışma Grupları"])

@router.post("", response_model=StudyGroupOut, status_code=status.HTTP_201_CREATED)
def create_study_group(
    data: StudyGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    group = StudyGroup(
        creator_id=current_user.id,
        course_id=data.course_id,
        title=data.title.strip(),
        topic=data.topic.strip(),
        description=data.description,
        max_members=data.max_members or 5,
        mode=data.mode or "online",
        scheduled_at=data.scheduled_at,
        meeting_link=data.meeting_link,
        location=data.location,
        status="open"
    )
    db.add(group)
    db.flush()

    # Add creator as member
    member = StudyGroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="creator"
    )
    db.add(member)
    db.commit()
    db.refresh(group)

    return _format_group(group, db)

@router.get("", response_model=List[StudyGroupOut])
def list_study_groups(
    course_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(StudyGroup)
    if course_id:
        query = query.filter(StudyGroup.course_id == course_id)
    if status_filter:
        query = query.filter(StudyGroup.status == status_filter)

    groups = query.order_by(StudyGroup.created_at.desc()).all()
    return [_format_group(g, db) for g in groups]

@router.get("/{group_id}", response_model=StudyGroupOut)
def get_study_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Çalışma grubu bulunamadı.")
    return _format_group(group, db)

@router.post("/{group_id}/join")
def join_study_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Çalışma grubu bulunamadı.")

    if group.status != "open":
        raise HTTPException(status_code=400, detail="Bu grup katılıma kapalı.")

    # Check existing membership
    existing = db.query(StudyGroupMember).filter(
        StudyGroupMember.group_id == group_id,
        StudyGroupMember.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Zaten bu gruba üyesiniz.")

    # Check capacity
    count = db.query(StudyGroupMember).filter(StudyGroupMember.group_id == group_id).count()
    if count >= group.max_members:
        group.status = "full"
        db.commit()
        raise HTTPException(status_code=400, detail="Grup kontenjanı dolmuştur.")

    member = StudyGroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="member"
    )
    db.add(member)

    # Check if now full
    if count + 1 >= group.max_members:
        group.status = "full"

    db.commit()
    return {"message": "Çalışma grubuna başarıyla katıldınız."}

@router.post("/{group_id}/leave")
def leave_study_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(StudyGroupMember).filter(
        StudyGroupMember.group_id == group_id,
        StudyGroupMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=400, detail="Bu grubun üyesi değilsiniz.")

    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if member.role == "creator":
        raise HTTPException(status_code=400, detail="Grup kurucusu gruptan ayrılamaz. Grubu silebilirsiniz.")

    db.delete(member)
    if group and group.status == "full":
        group.status = "open"

    db.commit()
    return {"message": "Gruptan ayrıldınız."}

def _format_group(group: StudyGroup, db: Session) -> StudyGroupOut:
    out = StudyGroupOut.model_validate(group)
    out.creator_name = group.creator.profile.full_name if group.creator and group.creator.profile else "Anonim"
    out.current_members_count = len(group.members)
    member_list = []
    for m in group.members:
        m_out = StudyGroupMemberOut.model_validate(m)
        m_out.user_name = m.user.profile.full_name if m.user and m.user.profile else "Üye"
        m_out.user_department = m.user.profile.department if m.user and m.user.profile else None
        member_list.append(m_out)
    out.members = member_list
    return out
