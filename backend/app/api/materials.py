import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Course, Topic
from app.models.material import StudyMaterial, ContentReport
from app.schemas.material import MaterialOut, ContentReportCreate, ContentReportOut
from app.api.deps import get_current_user, get_optional_current_user
from app.services.storage import sanitize_and_save_file

router = APIRouter(prefix="/materials", tags=["Ders Notları ve Kaynaklar"])

@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def upload_material(
    title: str = Form(...),
    course_id: int = Form(...),
    topic_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı.")

    # Save file securely
    stored = sanitize_and_save_file(file)

    material = StudyMaterial(
        uploader_id=current_user.id,
        course_id=course_id,
        topic_id=topic_id if topic_id else None,
        title=title.strip(),
        description=description.strip() if description else None,
        file_path=stored["file_path"],
        file_name=stored["file_name"],
        file_data=stored.get("file_data"),
        file_size=stored["file_size"],
        mime_type=stored["mime_type"],
        file_extension=stored["file_extension"],
        sha256_hash=stored["sha256_hash"],
        scan_status=stored["scan_status"],
        security_note=stored["security_note"],
        download_count=0,
        is_flagged=False
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    out = MaterialOut.model_validate(material)
    out.uploader_name = current_user.profile.full_name if current_user.profile else "Öğrenci"
    return out

@router.get("", response_model=List[MaterialOut])
def list_materials(
    course_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    extension: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(StudyMaterial)

    if course_id:
        query = query.filter(StudyMaterial.course_id == course_id)
    if extension:
        ext_clean = extension.lower() if extension.startswith(".") else f".{extension.lower()}"
        query = query.filter(StudyMaterial.file_extension == ext_clean)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(StudyMaterial.title.ilike(s) | StudyMaterial.description.ilike(s))

    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    results = []
    for m in materials:
        item = MaterialOut.model_validate(m)
        item.uploader_name = m.uploader.profile.full_name if m.uploader and m.uploader.profile else "Anonim"
        results.append(item)
    return results

@router.get("/{material_id}", response_model=MaterialOut)
def get_material_detail(material_id: int, db: Session = Depends(get_db)):
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")
    item = MaterialOut.model_validate(m)
    item.uploader_name = m.uploader.profile.full_name if m.uploader and m.uploader.profile else "Anonim"
    return item

@router.get("/{material_id}/download")
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    # Authorized download & Quarantine check
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    if m.is_flagged or m.scan_status == "quarantined":
        if not current_user or current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Bu dosya güvenlik veya telif incelemesi altında olduğu için erişime kapatılmıştır."
            )

    # Increment download count
    m.download_count += 1
    db.commit()

    import urllib.parse
    encoded_filename = urllib.parse.quote(m.file_name)
    secure_headers = {
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "X-Frame-Options": "DENY",
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
    }

    # 1. Dosya diskte mevcutsa doğrudan diskten sun
    if m.file_path and os.path.exists(m.file_path):
        return FileResponse(
            path=m.file_path,
            media_type=m.mime_type,
            filename=m.file_name,
            headers=secure_headers
        )

    # 2. Disk dosyası silinmişse (Render ephemeral restart) veritabanındaki kalıcı binary veriden sun
    if m.file_data:
        try:
            os.makedirs(os.path.dirname(m.file_path), exist_ok=True)
            with open(m.file_path, "wb") as f:
                f.write(m.file_data)
        except Exception:
            pass

        from fastapi.responses import Response
        return Response(
            content=m.file_data,
            media_type=m.mime_type,
            headers=secure_headers
        )

    raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı.")

@router.put("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    topic_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    if m.uploader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bu materyali düzenleme yetkiniz yok.")

    if course_id is not None:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Seçilen ders bulunamadı.")
        m.course_id = course_id

    if topic_id is not None:
        if topic_id > 0:
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            m.topic_id = topic.id if topic else None
        else:
            m.topic_id = None

    if title is not None and title.strip():
        m.title = title.strip()

    if description is not None:
        m.description = description.strip() if description.strip() else None

    # Handle file replacement if a new file is uploaded
    if file and file.filename:
        # Delete old file safely if exists
        if m.file_path and os.path.exists(m.file_path):
            try:
                os.remove(m.file_path)
            except Exception:
                pass

        stored = sanitize_and_save_file(file)
        m.file_path = stored["file_path"]
        m.file_name = stored["file_name"]
        m.file_data = stored.get("file_data")
        m.file_size = stored["file_size"]
        m.mime_type = stored["mime_type"]
        m.file_extension = stored["file_extension"]
        m.sha256_hash = stored["sha256_hash"]
        m.scan_status = stored["scan_status"]
        m.security_note = stored["security_note"]

    db.commit()
    db.refresh(m)

    out = MaterialOut.model_validate(m)
    out.uploader_name = m.uploader.profile.full_name if m.uploader and m.uploader.profile else "Öğrenci"
    return out

@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    if m.uploader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bu materyali silme yetkiniz yok.")

    # Remove physical file if exists
    if os.path.exists(m.file_path):
        try:
            os.remove(m.file_path)
        except Exception:
            pass

    db.delete(m)
    db.commit()
    return {"message": "Ders notu başarıyla silindi."}

@router.post("/{material_id}/report", response_model=ContentReportOut, status_code=status.HTTP_201_CREATED)
def report_material(
    material_id: int,
    data: ContentReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Materyal bulunamadı.")

    report = ContentReport(
        reporter_id=current_user.id,
        material_id=material_id,
        reason=data.reason,
        details=data.details,
        status="pending"
    )
    db.add(report)
    m.is_flagged = True
    db.commit()
    db.refresh(report)

    out = ContentReportOut.model_validate(report)
    out.reporter_name = current_user.profile.full_name if current_user.profile else "Öğrenci"
    out.material_title = m.title
    return out
