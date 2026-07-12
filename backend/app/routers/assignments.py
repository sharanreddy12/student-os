from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Assignment, Subject
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=List[AssignmentResponse])
def get_assignments(
    status_filter: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    query = db.query(Assignment).filter(Assignment.user_id == user_id)
    
    if status_filter:
        query = query.filter(Assignment.status == status_filter)
    
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    
    assignments = query.order_by(Assignment.due_date).all()
    return assignments


@router.post("", response_model=AssignmentResponse)
def create_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == assignment_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    new_assignment = Assignment(
        user_id=user_id,
        subject_id=assignment_data.subject_id,
        title=assignment_data.title,
        description=assignment_data.description,
        due_date=assignment_data.due_date,
        priority=assignment_data.priority,
        status="todo"
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == user_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    update_data = assignment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)
    
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == user_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    db.delete(assignment)
    db.commit()
