from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Course
from app.models.goal import LearningGoal
from app.schemas.goal import LearningGoalCreate, LearningGoalUpdate, LearningGoalOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Öğrenme Hedefleri"])

@router.get("", response_model=List[LearningGoalOut])
def get_my_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = (
        db.query(LearningGoal)
        .filter(LearningGoal.user_id == current_user.id)
        .order_by(LearningGoal.created_at.desc())
        .all()
    )
    return goals

@router.post("", response_model=LearningGoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: LearningGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    goal = LearningGoal(
        user_id=current_user.id,
        course_id=data.course_id,
        topic=data.topic.strip(),
        description=data.description.strip() if data.description else None,
        target_date=data.target_date,
        status="in_progress"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.put("/{goal_id}", response_model=LearningGoalOut)
def update_goal(
    goal_id: int,
    data: LearningGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(LearningGoal).filter(
        LearningGoal.id == goal_id,
        LearningGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı.")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(goal, k, v)

    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(LearningGoal).filter(
        LearningGoal.id == goal_id,
        LearningGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı.")

    db.delete(goal)
    db.commit()
    return {"message": "Öğrenme hedefi silindi."}
