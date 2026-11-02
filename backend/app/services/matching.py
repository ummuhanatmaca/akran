from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserProfile
from app.models.academic import StudentCoursePreference, StudentAvailability, Course
from app.models.support import SupportSession

def match_tutors(
    db: Session,
    course_id: int,
    topic_name: Optional[str] = None,
    preferred_mode: Optional[str] = "both",
    preferred_day: Optional[str] = None,
    exclude_user_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Kural tabanlı eşleştirme algoritması:
    1. Ders eşleşmesi (preference_type in ['teach', 'both'])
    2. Konu uyumu (topics_list contains topic_name)
    3. Zaman uygunluğu (availability matches preferred_day)
    4. Görüşme biçimi uyumu (online / in_person)
    5. Aktif kapasite / puan hesaplama
    """
    query = (
        db.query(StudentCoursePreference, User, UserProfile)
        .join(User, StudentCoursePreference.user_id == User.id)
        .join(UserProfile, User.id == UserProfile.user_id)
        .filter(StudentCoursePreference.course_id == course_id)
        .filter(StudentCoursePreference.preference_type.in_(["teach", "both"]))
        .filter(User.is_active == True)
    )

    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)

    candidates = query.all()
    results = []

    course = db.query(Course).filter(Course.id == course_id).first()
    course_name = course.name if course else "Ders"

    for pref, user, profile in candidates:
        score = 50  # Base course match score
        reasons = [f"{course_name} dersinde akran desteği veriyor."]

        # 2. Konu Uyumu
        if topic_name and pref.topics_list:
            if topic_name.lower() in pref.topics_list.lower():
                score += 30
                reasons.append(f"\"{topic_name}\" konusunda yetkinlik belirtti.")
            else:
                score += 10
        elif pref.topics_list:
            score += 10

        # 3. Görüşme biçimi
        if preferred_mode and preferred_mode != "both":
            if pref.mode_preference == "both" or pref.mode_preference == preferred_mode:
                score += 15
                mode_tr = "çevrim içi" if preferred_mode == "online" else "yüz yüze"
                reasons.append(f"{mode_tr} görüşme tercihine uygun.")
        else:
            score += 10

        # 4. Zaman Uygunluğu
        availabilities = db.query(StudentAvailability).filter(StudentAvailability.user_id == user.id).all()
        avail_str_list = [f"{a.day_of_week} ({a.start_time}-{a.end_time})" for a in availabilities]

        if preferred_day and availabilities:
            matched_day = any(preferred_day.lower() in a.day_of_week.lower() for a in availabilities)
            if matched_day:
                score += 20
                reasons.append(f"{preferred_day} günü müsait.")
            else:
                score += 5
        elif availabilities:
            score += 10

        # 5. Kapasite / Aktif Oturumlar
        active_sessions_count = (
            db.query(SupportSession)
            .filter(SupportSession.tutor_id == user.id, SupportSession.status == "scheduled")
            .count()
        )
        if active_sessions_count > 5:
            score -= 15
            reasons.append(f"Şu an {active_sessions_count} aktif oturumu var (yoğun).")
        else:
            score += 10
            reasons.append("Aktif destek kapasitesi müsait.")

        results.append({
            "user_id": user.id,
            "full_name": profile.full_name,
            "university": profile.university,
            "department": profile.department,
            "grade": profile.grade,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "topics": pref.topics_list,
            "mode_preference": pref.mode_preference,
            "availabilities": avail_str_list,
            "match_score": min(100, score),
            "match_explanation": " ".join(reasons)
        })

    # Sort descending by match_score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results
