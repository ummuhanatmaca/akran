from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageOut

router = APIRouter(prefix="/contact", tags=["İletişim ve Geri Bildirim"])

@router.post("", response_model=ContactMessageOut, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    data: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    msg = ContactMessage(
        name=data.name.strip(),
        email=data.email.strip().lower(),
        subject=data.subject.strip(),
        message=data.message.strip(),
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
