from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, RegisterRequest, Token, ChangePasswordRequest
from app.schemas.user import UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Kimlik Doğrulama"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle zaten kayıtlı bir hesap bulunmaktadır."
        )

    # Create User
    new_user = User(
        email=request.email.lower().strip(),
        hashed_password=hash_password(request.password),
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create User Profile
    new_profile = UserProfile(
        user_id=new_user.id,
        full_name=request.full_name.strip(),
        university=request.university.strip(),
        department=request.department.strip(),
        grade=request.grade.strip(),
        bio=request.bio.strip() if request.bio else None,
        interests=request.interests.strip() if request.interests else None,
        is_public=True
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)

    # Generate Token
    token = create_access_token({"user_id": new_user.id, "role": new_user.role})

    return Token(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        full_name=new_profile.full_name
    )

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya parola hatalı."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin."
        )

    token = create_access_token({"user_id": user.id, "role": user.role})
    full_name = user.profile.full_name if user.profile else user.email

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=full_name
    )

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut parolanız hatalı."
        )

    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni parola mevcut parola ile aynı olamaz."
        )

    current_user.hashed_password = hash_password(request.new_password)
    db.commit()

    return {"message": "Parolanız başarıyla güncellendi."}
