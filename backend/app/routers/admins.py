from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole, UserStatus
from app.schemas import AdminCreate, AdminUpdate, UserResponse
from app.auth import get_password_hash
from app.dependencies import RequireMinRole

router = APIRouter(prefix="/admins", tags=["admins"])

# Enforce Super Admin only access to manage Admins
super_admin_only = RequireMinRole(UserRole.SUPER_ADMIN)


@router.post("", response_model=UserResponse)
def create_admin(
    schema: AdminCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
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
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        created_by=current_user["id"]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("", response_model=List[UserResponse])
def list_admins(
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    return db.query(User).filter(User.role == UserRole.ADMIN).all()


@router.put("/{id}", response_model=UserResponse)
def update_admin(
    id: int,
    schema: AdminUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.ADMIN).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
        
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
def deactivate_admin(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(super_admin_only)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.ADMIN).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    user.status = UserStatus.INACTIVE
    db.commit()
    db.refresh(user)
    return user
