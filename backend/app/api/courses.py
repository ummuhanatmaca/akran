from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.academic import Course, Topic
from app.schemas.academic import CourseCreate, CourseOut, TopicCreate, TopicOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/courses", tags=["Dersler ve Konular"])

@router.get("", response_model=List[CourseOut])
def get_all_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).order_by(Course.code.asc()).all()
    return courses

@router.get("/{course_id}", response_model=CourseOut)
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")
    return course

@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Course).filter(Course.code == data.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu ders kodu zaten mevcut.")

    course = Course(
        code=data.code.upper().strip(),
        name=data.name.strip(),
        description=data.description,
        faculty=data.faculty
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.post("/{course_id}/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    course_id: int,
    data: TopicCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    topic = Topic(
        course_id=course.id,
        name=data.name.strip(),
        description=data.description
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic
