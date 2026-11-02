from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.user import User
from app.models.opportunity import (
    Opportunity,
    OpportunityFavorite,
    OpportunityTracking,
    ProjectIdea,
    ProjectTeamApplication,
    GuideArticle
)
from app.schemas.opportunity import (
    OpportunityOut,
    OpportunityTrackingUpdate,
    OpportunityTrackingOut,
    ProjectIdeaCreate,
    ProjectIdeaOut,
    ProjectTeamAppCreate,
    ProjectTeamAppOut,
    GuideArticleOut
)
from app.api.deps import get_current_user, get_optional_current_user

from sqlalchemy import case

router = APIRouter(prefix="/opportunities", tags=["Bilimsel Fırsatlar ve Projeler"])

@router.get("", response_model=List[OpportunityOut])
def list_opportunities(
    category: Optional[str] = Query(None),
    application_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    target_audience: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("newest", description="'newest', 'deadline_approaching', 'open_first'"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Opportunity)
    now = datetime.utcnow()

    if category:
        query = query.filter(Opportunity.category == category)
    if application_type and application_type != "all":
        query = query.filter(Opportunity.application_type.in_([application_type, "both"]))
    if target_audience and target_audience != "all":
        query = query.filter(Opportunity.target_audience.ilike(f"%{target_audience}%"))
    if status_filter and status_filter != "all":
        # Support legacy active/expired
        if status_filter in ("open", "active"):
            query = query.filter(Opportunity.status.in_(["open", "active"]))
        elif status_filter in ("closed", "expired"):
            query = query.filter(Opportunity.status.in_(["closed", "expired"]))
        else:
            query = query.filter(Opportunity.status == status_filter)

    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            Opportunity.title.ilike(s) |
            Opportunity.organization.ilike(s) |
            Opportunity.fields.ilike(s) |
            Opportunity.summary.ilike(s)
        )

    # Sorting
    if sort_by == "deadline_approaching":
        # Items with future deadline first, then without deadline
        query = query.order_by(
            case(
                (Opportunity.end_date >= now, 0),
                (Opportunity.end_date.is_(None), 1),
                else_=2
            ),
            Opportunity.end_date.asc()
        )
    elif sort_by == "open_first":
        query = query.order_by(
            case(
                (Opportunity.status.in_(["open", "active"]), 0),
                (Opportunity.status == "upcoming", 1),
                (Opportunity.status == "pending_verification", 2),
                else_=3
            ),
            Opportunity.created_at.desc()
        )
    else: # newest
        query = query.order_by(Opportunity.created_at.desc())

    opportunities = query.all()
    results = []

    user_fav_ids = set()
    user_tracking_map = {}
    if current_user:
        favs = db.query(OpportunityFavorite.opportunity_id).filter(OpportunityFavorite.user_id == current_user.id).all()
        user_fav_ids = {f[0] for f in favs}
        tracks = db.query(OpportunityTracking).filter(OpportunityTracking.user_id == current_user.id).all()
        user_tracking_map = {t.opportunity_id: t.status for t in tracks}

    for opp in opportunities:
        status_val = opp.status
        # Map legacy
        if status_val == "active":
            status_val = "open"
        elif status_val == "expired":
            status_val = "closed"

        # Check if expired based on end_date
        if opp.end_date and opp.end_date < now:
            status_val = "closed"

        item = OpportunityOut.model_validate(opp)
        item.status = status_val
        item.is_favorited = opp.id in user_fav_ids
        item.tracking_status = user_tracking_map.get(opp.id)
        results.append(item)

    return results

@router.get("/guides", response_model=List[GuideArticleOut])
def list_guides(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(GuideArticle)
    if category and category != "all":
        query = query.filter(GuideArticle.category == category)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            GuideArticle.title.ilike(s) |
            GuideArticle.summary.ilike(s) |
            GuideArticle.category.ilike(s)
        )
    return query.order_by(GuideArticle.id.asc()).all()

@router.get("/guides/{slug}", response_model=GuideArticleOut)
def get_guide_detail(slug: str, db: Session = Depends(get_db)):
    guide = db.query(GuideArticle).filter(GuideArticle.slug == slug).first()
    if not guide:
        # Also try searching by id if numeric
        if slug.isdigit():
            guide = db.query(GuideArticle).filter(GuideArticle.id == int(slug)).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Rehber içeriği bulunamadı.")
    return guide

@router.get("/{opp_id}", response_model=OpportunityOut)
def get_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı.")

    item = OpportunityOut.model_validate(opp)
    if current_user:
        fav = db.query(OpportunityFavorite).filter(
            OpportunityFavorite.user_id == current_user.id,
            OpportunityFavorite.opportunity_id == opp_id
        ).first()
        item.is_favorited = fav is not None

        track = db.query(OpportunityTracking).filter(
            OpportunityTracking.user_id == current_user.id,
            OpportunityTracking.opportunity_id == opp_id
        ).first()
        item.tracking_status = track.status if track else None

    return item

# Favorites
@router.post("/{opp_id}/favorite")
def toggle_favorite(
    opp_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı.")

    fav = db.query(OpportunityFavorite).filter(
        OpportunityFavorite.user_id == current_user.id,
        OpportunityFavorite.opportunity_id == opp_id
    ).first()

    if fav:
        db.delete(fav)
        db.commit()
        return {"favorited": False, "message": "Favorilerden çıkarıldı."}
    else:
        new_fav = OpportunityFavorite(user_id=current_user.id, opportunity_id=opp_id)
        db.add(new_fav)
        db.commit()
        return {"favorited": True, "message": "Favorilere eklendi."}

@router.get("/user/favorites", response_model=List[OpportunityOut])
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favs = (
        db.query(Opportunity)
        .join(OpportunityFavorite, Opportunity.id == OpportunityFavorite.opportunity_id)
        .filter(OpportunityFavorite.user_id == current_user.id)
        .all()
    )
    results = []
    for opp in favs:
        item = OpportunityOut.model_validate(opp)
        item.is_favorited = True
        results.append(item)
    return results

# Tracking
@router.post("/{opp_id}/tracking", response_model=OpportunityTrackingOut)
def update_tracking(
    opp_id: int,
    data: OpportunityTrackingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı.")

    track = db.query(OpportunityTracking).filter(
        OpportunityTracking.user_id == current_user.id,
        OpportunityTracking.opportunity_id == opp_id
    ).first()

    if track:
        track.status = data.status
        if data.notes is not None:
            track.notes = data.notes
    else:
        track = OpportunityTracking(
            user_id=current_user.id,
            opportunity_id=opp_id,
            status=data.status,
            notes=data.notes
        )
        db.add(track)

    db.commit()
    db.refresh(track)
    return track

@router.get("/user/tracking", response_model=List[OpportunityTrackingOut])
def get_user_tracking_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tracks = (
        db.query(OpportunityTracking)
        .filter(OpportunityTracking.user_id == current_user.id)
        .order_by(OpportunityTracking.updated_at.desc())
        .all()
    )
    return tracks

# Team Finder (Project Ideas)
@router.get("/projects/all", response_model=List[ProjectIdeaOut])
def list_project_ideas(db: Session = Depends(get_db)):
    projects = db.query(ProjectIdea).order_by(ProjectIdea.created_at.desc()).all()
    results = []
    for p in projects:
        item = ProjectIdeaOut.model_validate(p)
        item.creator_name = p.creator.profile.full_name if p.creator and p.creator.profile else "Anonim"
        results.append(item)
    return results

@router.post("/projects", response_model=ProjectIdeaOut, status_code=status.HTTP_201_CREATED)
def create_project_idea(
    data: ProjectIdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = ProjectIdea(
        creator_id=current_user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category.strip(),
        required_skills=data.required_skills.strip(),
        status="open"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    item = ProjectIdeaOut.model_validate(project)
    item.creator_name = current_user.profile.full_name if current_user.profile else "Öğrenci"
    return item

@router.post("/projects/{project_id}/apply", response_model=ProjectTeamAppOut)
def apply_to_project_team(
    project_id: int,
    data: ProjectTeamAppCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(ProjectIdea).filter(ProjectIdea.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")

    if project.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi projenize başvuru yapamazsınız.")

    existing = db.query(ProjectTeamApplication).filter(
        ProjectTeamApplication.project_id == project_id,
        ProjectTeamApplication.applicant_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu projeye zaten başvuru yaptınız.")

    app = ProjectTeamApplication(
        project_id=project_id,
        applicant_id=current_user.id,
        message=data.message.strip(),
        status="pending"
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    out = ProjectTeamAppOut.model_validate(app)
    out.applicant_name = current_user.profile.full_name if current_user.profile else "Öğrenci"
    out.applicant_department = current_user.profile.department if current_user.profile else None
    return out
