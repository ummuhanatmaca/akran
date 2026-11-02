from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Giriş yapmanız gerekiyor.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum süreniz dolmuş veya geçersiz.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id: int = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kimlik doğrulama belirteci."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız askıya alınmıştır. Lütfen yöneticiyle iletişime geçin."
        )

    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("user_id")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gerekmektedir."
        )
    return current_user
