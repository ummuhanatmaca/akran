from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contact import ContactMessage
from app.models.user import User
from app.models.notification import Notification
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
    db.flush()

    # Tüm yöneticilere anlık bildirim oluştur
    try:
        admins = db.query(User).filter(User.role == "admin").all()
        for adm in admins:
            notif = Notification(
                user_id=adm.id,
                title="Yeni İletişim Mesajı",
                message=f"{msg.name} ({msg.email}) adlı kullanıcı '{msg.subject}' konulu bir mesaj iletti.",
                type="contact_message",
                link="/admin"
            )
            db.add(notif)
    except Exception as n_err:
        print(f"Admin notification notice: {n_err}")

    db.commit()
    db.refresh(msg)
    return msg
