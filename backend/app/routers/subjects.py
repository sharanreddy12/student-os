from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Subject
from app.schemas import SubjectCreate, SubjectUpdate, SubjectResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    return subjects


@router.post("", response_model=SubjectResponse)
def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    new_subject = Subject(
        user_id=user_id,
        name=subject_data.name,
        code=subject_data.code,
        color=subject_data.color
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    update_data = subject_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    db.delete(subject)
    db.commit()
