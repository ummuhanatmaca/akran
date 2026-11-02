from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User, UserProfile
from app.models.academic import StudentCoursePreference, StudentAvailability, Course
from app.schemas.user import UserProfileOut, UserProfileUpdate, UserOut
from app.schemas.academic import CoursePreferenceCreate, CoursePreferenceOut, AvailabilityCreate, AvailabilityOut
from app.services.matching import match_tutors

router = APIRouter(prefix="/users", tags=["Kullanıcı ve Profil"])

@router.get("/profile", response_model=UserProfileOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    if not current_user.profile:
        raise HTTPException(status_code=404, detail="Profil bulunamadı.")
    return current_user.profile

@router.put("/profile", response_model=UserProfileOut)
def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id, full_name="İsimsiz")
        db.add(profile)

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return profile

# Course Preferences (Teach / Learn)
@router.get("/preferences", response_model=List[CoursePreferenceOut])
def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = db.query(StudentCoursePreference).filter(StudentCoursePreference.user_id == current_user.id).all()
    return prefs

@router.post("/preferences", response_model=CoursePreferenceOut)
def set_course_preference(
    data: CoursePreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    existing = db.query(StudentCoursePreference).filter(
        StudentCoursePreference.user_id == current_user.id,
        StudentCoursePreference.course_id == data.course_id
    ).first()

    if existing:
        existing.preference_type = data.preference_type
        existing.topics_list = data.topics_list
        existing.description = data.description
        existing.mode_preference = data.mode_preference or "both"
        db.commit()
        db.refresh(existing)
        return existing

    pref = StudentCoursePreference(
        user_id=current_user.id,
        course_id=data.course_id,
        preference_type=data.preference_type,
        topics_list=data.topics_list,
        description=data.description,
        mode_preference=data.mode_preference or "both"
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref

@router.delete("/preferences/{pref_id}")
def delete_course_preference(
    pref_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(StudentCoursePreference).filter(
        StudentCoursePreference.id == pref_id,
        StudentCoursePreference.user_id == current_user.id
    ).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Tercih bulunamadı.")
    db.delete(pref)
    db.commit()
    return {"message": "Ders tercihi başarıyla silindi."}

# Availability
@router.get("/availability", response_model=List[AvailabilityOut])
def get_my_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(StudentAvailability).filter(StudentAvailability.user_id == current_user.id).all()

@router.post("/availability", response_model=AvailabilityOut)
def add_availability(
    data: AvailabilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avail = StudentAvailability(
        user_id=current_user.id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        mode=data.mode or "both"
    )
    db.add(avail)
    db.commit()
    db.refresh(avail)
    return avail

@router.delete("/availability/{avail_id}")
def delete_availability(
    avail_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avail = db.query(StudentAvailability).filter(
        StudentAvailability.id == avail_id,
        StudentAvailability.user_id == current_user.id
    ).first()
    if not avail:
        raise HTTPException(status_code=404, detail="Uygunluk saati bulunamadı.")
    db.delete(avail)
    db.commit()
    return {"message": "Uygunluk zamanı silindi."}

# Tutors search & matching algorithm
@router.get("/tutors/search")
def search_and_match_tutors(
    course_id: int = Query(..., description="Ders ID"),
    topic: Optional[str] = Query(None, description="Konu adı"),
    mode: Optional[str] = Query("both", description="Görüşme şekli (online, in_person, both)"),
    day: Optional[str] = Query(None, description="Müsait gün"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    user_id = current_user.id if current_user else None
    results = match_tutors(
        db=db,
        course_id=course_id,
        topic_name=topic,
        preferred_mode=mode,
        preferred_day=day,
        exclude_user_id=user_id
    )
    return results

# Public User Profile
@router.get("/{user_id}")
def get_user_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Öğrenci profili bulunamadı.")

    # Hide sensitive personal email/phone if requested or not public
    profile_data = {
        "id": user.id,
        "full_name": user.profile.full_name,
        "university": user.profile.university,
        "department": user.profile.department,
        "grade": user.profile.grade,
        "bio": user.profile.bio,
        "interests": user.profile.interests,
        "avatar_url": user.profile.avatar_url,
        "teach_courses": [
            {
                "course_id": p.course.id,
                "course_name": p.course.name,
                "course_code": p.course.code,
                "topics": p.topics_list,
                "mode": p.mode_preference
            }
            for p in user.course_preferences if p.preference_type in ["teach", "both"]
        ],
        "learn_courses": [
            {
                "course_id": p.course.id,
                "course_name": p.course.name,
                "course_code": p.course.code
            }
            for p in user.course_preferences if p.preference_type in ["learn", "both"]
        ],
        "availabilities": [
            {"day": a.day_of_week, "start": a.start_time, "end": a.end_time, "mode": a.mode}
            for a in user.availabilities
        ]
    }
    return profile_data
