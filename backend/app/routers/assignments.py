from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Assignment, Subject, UserRole, User, Notification, StudentSubject
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _teacher_can_manage_subject(subject, teacher_id: int) -> bool:
    return subject is not None and subject.teacher_id == teacher_id


@router.get("", response_model=List[AssignmentResponse])
def get_assignments(
    status_filter: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.STUDENT:
        # Students see only their own assignments
        query = db.query(Assignment).filter(Assignment.user_id == user_id)
    elif role == UserRole.TEACHER:
        # Teachers see assignments for subjects they teach
        taught_subjects = db.query(Subject.id).filter(Subject.teacher_id == user_id).all()
        subject_ids = [s[0] for s in taught_subjects]
        query = db.query(Assignment).filter(Assignment.subject_id.in_(subject_ids))
        
        if student_id:
            query = query.filter(Assignment.user_id == student_id)
    else:
        # Admin / Super Admin
        if student_id:
            query = db.query(Assignment).filter(Assignment.user_id == student_id)
        else:
            query = db.query(Assignment)
            
    if status_filter:
        query = query.filter(Assignment.status == status_filter)
        
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
        
    return query.order_by(Assignment.due_date.asc()).all()


@router.post("", response_model=AssignmentResponse)
def create_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students are not authorized to create assignments"
        )
        
    # Verify subject exists and belongs to the teacher if role is TEACHER
    subject_query = db.query(Subject).filter(Subject.id == assignment_data.subject_id)
    if role == UserRole.TEACHER:
        subject_query = subject_query.filter(Subject.teacher_id == user_id)
        
    subject = subject_query.first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or access denied"
        )

    enrolled_students = db.query(StudentSubject).filter(
        StudentSubject.subject_id == subject.id,
        StudentSubject.is_active == True
    ).all()
    
    if not enrolled_students:
        new_asg = Assignment(
            user_id=user_id,
            subject_id=subject.id,
            title=assignment_data.title.strip(),
            description=assignment_data.description,
            due_date=assignment_data.due_date,
            priority=assignment_data.priority,
            max_marks=assignment_data.max_marks,
            status="todo"
        )
        db.add(new_asg)
        db.commit()
        db.refresh(new_asg)
        return new_asg

    last_asg = None
    for assignment_row in enrolled_students:
        stud_id = assignment_row.student_id
        new_asg = Assignment(
            user_id=stud_id,
            subject_id=subject.id,
            title=assignment_data.title.strip(),
            description=assignment_data.description,
            due_date=assignment_data.due_date,
            priority=assignment_data.priority,
            max_marks=assignment_data.max_marks,
            status="todo"
        )
        db.add(new_asg)
        
        notif = Notification(
            user_id=stud_id,
            title="New Assignment Created",
            content=f"A new assignment '{assignment_data.title}' has been posted for {subject.name}. Due date: {assignment_data.due_date.strftime('%Y-%m-%d')}."
        )
        db.add(notif)
        last_asg = new_asg
        
    db.commit()
    db.refresh(last_asg)
    return last_asg


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
        
    if role == UserRole.STUDENT:
        if assignment.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied. Not your assignment.")
        if assignment_data.status is not None:
            assignment.status = assignment_data.status
    else:
        if role == UserRole.TEACHER:
            subject = db.query(Subject).filter(Subject.id == assignment.subject_id, Subject.teacher_id == user_id).first()
            if not _teacher_can_manage_subject(subject, user_id):
                raise HTTPException(status_code=403, detail="Access denied. You do not teach this subject.")

        update_data = assignment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(assignment, field, value)
            
        if "marks_obtained" in update_data and update_data["marks_obtained"] is not None:
            notif = Notification(
                user_id=assignment.user_id,
                title="Assignment Graded",
                content=f"Your assignment '{assignment.title}' has been evaluated. Marks: {assignment.marks_obtained}/{assignment.max_marks}."
            )
            db.add(notif)
            
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
    role = current_user["role"]
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
        
    if role == UserRole.TEACHER:
        # Verify teacher teaches this subject
        subject = db.query(Subject).filter(Subject.id == assignment.subject_id, Subject.teacher_id == user_id).first()
        if not subject:
            raise HTTPException(status_code=403, detail="Access denied. You do not teach this subject.")
    elif role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot delete assignments.")
        
    db.delete(assignment)
    db.commit()
