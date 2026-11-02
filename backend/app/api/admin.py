from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Course, Topic
from app.models.support import SupportRequest, SupportSession
from app.models.material import StudyMaterial, ContentReport
from app.models.opportunity import Opportunity, GuideArticle
from app.schemas.user import UserOut
from app.schemas.admin import AdminStatsOut, AdminUserUpdate
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityOut,
    GuideArticleCreate,
    GuideArticleOut
)
from app.schemas.material import ContentReportOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Yönetici Paneli"])

@router.get("/stats", response_model=AdminStatsOut)
def get_system_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_support_requests = db.query(SupportRequest).count()
    completed_sessions = db.query(SupportSession).filter(SupportSession.status == "completed").count()
    total_materials = db.query(StudyMaterial).count()
    active_opportunities = db.query(Opportunity).filter(Opportunity.status == "active").count()
    pending_reports = db.query(ContentReport).filter(ContentReport.status == "pending").count()

    return AdminStatsOut(
        total_users=total_users,
        active_users=active_users,
        total_support_requests=total_support_requests,
        completed_sessions=completed_sessions,
        total_materials=total_materials,
        active_opportunities=active_opportunities,
        pending_reports=pending_reports
    )

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}", response_model=UserOut)
def update_user_status(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role

    db.commit()
    db.refresh(user)
    return user

# Opportunities Management
@router.post("/opportunities", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
def admin_create_opportunity(
    data: OpportunityCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    opp = Opportunity(
        title=data.title.strip(),
        organization=data.organization.strip(),
        category=data.category.strip(),
        fields=data.fields,
        target_audience=data.target_audience,
        application_type=data.application_type or "both",
        requirements=data.requirements,
        start_date=data.start_date,
        end_date=data.end_date,
        prize_support=data.prize_support,
        official_url=data.official_url.strip(),
        is_sample=data.is_sample or False,
        status="active"
    )
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp

@router.put("/opportunities/{opp_id}", response_model=OpportunityOut)
def admin_update_opportunity(
    opp_id: int,
    data: OpportunityUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı.")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(opp, k, v)

    db.commit()
    db.refresh(opp)
    return opp

@router.delete("/opportunities/{opp_id}")
def admin_delete_opportunity(
    opp_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı.")

    db.delete(opp)
    db.commit()
    return {"message": "Fırsat başarıyla silindi."}

@router.post("/opportunities/sync")
def admin_sync_opportunities(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        from app.services.opportunity_verifier import verify_and_sync_opportunities
        result = verify_and_sync_opportunities(db)
        return result
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "trace": traceback.format_exc()}

@router.get("/opportunities/sync-logs")
def list_sync_logs(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.models.opportunity import OpportunitySyncLog
    logs = db.query(OpportunitySyncLog).order_by(OpportunitySyncLog.checked_at.desc()).limit(20).all()
    return logs

# Guides Management
@router.post("/guides", response_model=GuideArticleOut, status_code=status.HTTP_201_CREATED)
def admin_create_guide(
    data: GuideArticleCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(GuideArticle).filter(GuideArticle.slug == data.slug.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu slug ile kayıtlı rehber zaten var.")

    # Calculate real reading time based on word count
    import re
    words = len(re.findall(r'\w+', data.content))
    real_read_time = max(2, (words // 160) + 1)

    guide = GuideArticle(
        title=data.title.strip(),
        slug=data.slug.strip(),
        category=data.category.strip(),
        target_audience=data.target_audience,
        summary=data.summary.strip(),
        content=data.content.strip(),
        checklist_items=data.checklist_items,
        template_example=data.template_example,
        official_sources=data.official_sources,
        read_time_minutes=real_read_time
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)
    return guide

@router.put("/guides/{guide_id}", response_model=GuideArticleOut)
def admin_update_guide(
    guide_id: int,
    data: GuideArticleCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    guide = db.query(GuideArticle).filter(GuideArticle.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Rehber bulunamadı.")

    import re
    words = len(re.findall(r'\w+', data.content))
    real_read_time = max(2, (words // 160) + 1)

    guide.title = data.title.strip()
    guide.slug = data.slug.strip()
    guide.category = data.category.strip()
    guide.target_audience = data.target_audience
    guide.summary = data.summary.strip()
    guide.content = data.content.strip()
    guide.checklist_items = data.checklist_items
    guide.template_example = data.template_example
    guide.official_sources = data.official_sources
    guide.read_time_minutes = real_read_time

    db.commit()
    db.refresh(guide)
    return guide

@router.delete("/guides/{guide_id}")
def admin_delete_guide(
    guide_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    guide = db.query(GuideArticle).filter(GuideArticle.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Rehber bulunamadı.")

    db.delete(guide)
    db.commit()
    return {"message": "Rehber başarıyla silindi."}

# Reports Management
@router.get("/reports", response_model=List[ContentReportOut])
def list_reports(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reports = db.query(ContentReport).order_by(ContentReport.created_at.desc()).all()
    results = []
    for r in reports:
        item = ContentReportOut.model_validate(r)
        item.reporter_name = r.reporter.profile.full_name if r.reporter and r.reporter.profile else "Anonim"
        item.material_title = r.material.title if r.material else "Silinmiş Materyal"
        results.append(item)
    return results

@router.put("/reports/{report_id}")
def resolve_report(
    report_id: int,
    action: str = Query(..., description="'dismiss' veya 'remove_material'"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Bildiri bulunamadı.")

    if action == "dismiss":
        report.status = "dismissed"
        if report.material:
            report.material.is_flagged = False
    elif action == "remove_material":
        report.status = "removed"
        if report.material:
            db.delete(report.material)

    db.commit()
    return {"message": f"Bildiri '{report.status}' olarak güncellendi."}

# File Security Audit Management
@router.get("/materials/security-audit")
def list_materials_security_audit(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.models.material import StudyMaterial
    materials = db.query(StudyMaterial).order_by(StudyMaterial.created_at.desc()).all()
    results = []
    for m in materials:
        results.append({
            "id": m.id,
            "title": m.title,
            "file_name": m.file_name,
            "file_size": m.file_size,
            "file_extension": m.file_extension,
            "mime_type": m.mime_type,
            "sha256_hash": m.sha256_hash,
            "scan_status": m.scan_status,
            "security_note": m.security_note,
            "is_flagged": m.is_flagged,
            "download_count": m.download_count,
            "course_code": m.course.code if m.course else None,
            "uploader_email": m.uploader.email if m.uploader else "Bilinmiyor",
            "uploader_name": m.uploader.profile.full_name if m.uploader and m.uploader.profile else "Anonim",
            "created_at": m.created_at
        })
    return results

@router.post("/materials/{material_id}/rescan")
def rescan_material(
    material_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    import os
    from app.models.material import StudyMaterial
    from app.services.security_scanner import scan_file_security, SecurityScanError
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    if not os.path.exists(m.file_path):
        m.scan_status = "quarantined"
        m.security_note = "Hata: Dosya sunucu diskinde fiziksel olarak bulunamadı."
        db.commit()
        return {"status": "quarantined", "note": m.security_note}

    try:
        with open(m.file_path, "rb") as f:
            contents = f.read()
        scan_res = scan_file_security(contents, m.file_name, m.file_extension)
        m.sha256_hash = scan_res["sha256"]
        m.scan_status = scan_res["scan_status"]
        m.security_note = scan_res["security_note"]
        db.commit()
        return {"status": "clean", "note": m.security_note, "sha256": m.sha256_hash}
    except SecurityScanError as sse:
        m.scan_status = "quarantined"
        m.is_flagged = True
        m.security_note = str(sse)
        db.commit()
        return {"status": "quarantined", "note": str(sse)}

@router.put("/materials/{material_id}/quarantine")
def toggle_quarantine_material(
    material_id: int,
    quarantine: bool = Query(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.models.material import StudyMaterial
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    if quarantine:
        m.scan_status = "quarantined"
        m.is_flagged = True
        m.security_note = "Yönetici tarafından manuel karantinaya alındı."
    else:
        m.scan_status = "clean"
        m.is_flagged = False
        m.security_note = "Yönetici tarafından güvenli olarak onaylandı."

    db.commit()
    return {"message": f"Materyal durumu '{m.scan_status}' olarak güncellendi."}

