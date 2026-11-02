#!/usr/bin/env python
import sys
import os

# Set python path to backend
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

def set_admin_password(new_password: str, new_email: str = None):
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            print("Hata: Sistemde yonetici hesabi bulunamadi.")
            return False

        admin.hashed_password = hash_password(new_password)
        if new_email:
            admin.email = new_email.lower().strip()

        db.commit()
        print(f"Basarili: Yonetici hesabi guncellendi!")
        print(f"E-Posta: {admin.email}")
        print(f"Parola: {new_password}")
        return True
    except Exception as e:
        db.rollback()
        print(f"Hata olustu: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanim: python set_admin_password.py <YENI_PAROLA> [YENI_EPOSTA]")
        sys.exit(1)

    pwd = sys.argv[1]
    email = sys.argv[2] if len(sys.argv) > 2 else None
    set_admin_password(pwd, email)
