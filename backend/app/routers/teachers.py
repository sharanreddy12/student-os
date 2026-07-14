from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole, UserStatus, Subject
from app.schemas import TeacherCreate, TeacherUpdate, UserResponse
from app.auth import get_password_hash
from app.dependencies import RequireMinRole

router = APIRouter(prefix="/teachers", tags=["teachers"])

# Enforce Admin or Super Admin access to manage Teachers
admin_or_above = RequireMinRole(UserRole.ADMIN)


@router.post("", response_model=UserResponse)
def create_teacher(
    schema: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_above)
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
        role=UserRole.TEACHER,
        status=UserStatus.ACTIVE,
        created_by=current_user["id"],
        department=schema.department,
        designation=schema.designation
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("", response_model=List[UserResponse])
def list_teachers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_above)
):
    return db.query(User).filter(User.role == UserRole.TEACHER).all()


@router.put("/{id}", response_model=UserResponse)
def update_teacher(
    id: int,
    schema: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_above)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.TEACHER).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
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
    if schema.department is not None:
        user.department = schema.department
    if schema.designation is not None:
        user.designation = schema.designation
    if schema.status is not None:
        user.status = schema.status
        
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{id}/deactivate", response_model=UserResponse)
def deactivate_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_above)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.TEACHER).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    user.status = UserStatus.INACTIVE
    db.commit()
    db.refresh(user)
    return user


# Assign Teacher to Subject
@router.post("/{teacher_id}/subjects/{subject_id}", response_model=UserResponse)
def assign_teacher_to_subject(
    teacher_id: int,
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_or_above)
):
    teacher = db.query(User).filter(User.id == teacher_id, User.role == UserRole.TEACHER).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
        
    subject.teacher_id = teacher_id
    db.commit()
    return teacher
