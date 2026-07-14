from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole, UserStatus
from app.schemas import SuperAdminCreate, SuperAdminUpdate, UserResponse
from app.auth import get_password_hash
from app.dependencies import RequireMinRole

router = APIRouter(prefix="/super-admins", tags=["super-admins"])

# Enforce Super Admin only access for all endpoints in this router
admin_only = RequireMinRole(UserRole.SUPER_ADMIN)


def verify_not_last_active_super_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.role == UserRole.SUPER_ADMIN and user.status == UserStatus.ACTIVE:
        active_count = db.query(User).filter(
            User.role == UserRole.SUPER_ADMIN,
            User.status == UserStatus.ACTIVE
        ).count()
        if active_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate or change role/status of the last active Super Admin."
            )


@router.post("", response_model=UserResponse)
def create_super_admin(
    schema: SuperAdminCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    # Check email unique
    existing = db.query(User).filter(User.email == schema.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed = get_password_hash(schema.password)
    new_user = User(
        name=schema.name,
        email=schema.email,
        password_hash=hashed,
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        created_by=current_user["id"]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("", response_model=List[UserResponse])
def list_super_admins(
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    return db.query(User).filter(User.role == UserRole.SUPER_ADMIN).all()


@router.put("/{id}", response_model=UserResponse)
def update_super_admin(
    id: int,
    schema: SuperAdminUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.SUPER_ADMIN).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Super Admin not found"
        )
    
    if schema.status and schema.status != UserStatus.ACTIVE:
        verify_not_last_active_super_admin(id, db)
        
    if schema.name is not None:
        user.name = schema.name
    if schema.email is not None:
        # Check email unique if changed
        if schema.email != user.email:
            existing = db.query(User).filter(User.email == schema.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        user.email = schema.email
    if schema.password is not None:
        user.password_hash = get_password_hash(schema.password)
    if schema.status is not None:
        user.status = schema.status
        
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{id}/deactivate", response_model=UserResponse)
def deactivate_super_admin(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.SUPER_ADMIN).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Super Admin not found"
        )
    
    verify_not_last_active_super_admin(id, db)
    
    user.status = UserStatus.INACTIVE
    db.commit()
    db.refresh(user)
    return user
