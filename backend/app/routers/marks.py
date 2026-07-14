from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Mark, User, UserRole, Subject, Notification
from app.schemas import MarkCreate, MarkUpdate, MarkResponse
from app.dependencies import get_current_user, teacher_or_above

router = APIRouter(prefix="/marks", tags=["marks"])


def calculate_grade_metrics(quiz: float, assignment: float, lab: float, internal: float, mid_exam: float, practical: float, final: float):
    # Total marks (out of 100)
    quiz_val = quiz or 0.0
    asg_val = assignment or 0.0
    lab_val = lab or 0.0
    int_val = internal or 0.0
    mid_val = mid_exam or 0.0
    prac_val = practical or 0.0
    final_val = final or 0.0
    
    total = quiz_val + asg_val + lab_val + int_val + mid_val + prac_val + final_val
    percentage = total  # Assuming out of 100 max points
    average = total / 7.0
    
    # Letter Grade
    if percentage >= 90.0:
        grade = "O"
    elif percentage >= 80.0:
        grade = "A+"
    elif percentage >= 70.0:
        grade = "A"
    elif percentage >= 60.0:
        grade = "B"
    elif percentage >= 50.0:
        grade = "C"
    else:
        grade = "F"
        
    return total, average, percentage, grade


@router.post("", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def create_mark(
    schema: MarkCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    student = db.query(User).filter(User.id == schema.user_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user["role"] == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == schema.subject_id, Subject.teacher_id == current_user["id"]).first()
        if not subject:
            raise HTTPException(status_code=403, detail="Access denied. You do not teach this subject.")
    else:
        subject = db.query(Subject).filter(Subject.id == schema.subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

    # Check if duplicate entry
    existing = db.query(Mark).filter(Mark.user_id == schema.user_id, Mark.subject_id == schema.subject_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Marks already entered for this student in this subject")

    total, average, percentage, grade = calculate_grade_metrics(
        schema.quiz, schema.assignment, schema.lab, schema.internal, schema.mid_exam, schema.practical, schema.final
    )

    new_mark = Mark(
        user_id=schema.user_id,
        subject_id=schema.subject_id,
        quiz=schema.quiz,
        assignment=schema.assignment,
        lab=schema.lab,
        internal=schema.internal,
        mid_exam=schema.mid_exam,
        practical=schema.practical,
        final=schema.final,
        total=total,
        average=average,
        percentage=percentage,
        grade=grade
    )
    db.add(new_mark)
    
    # Notify student
    notif = Notification(
        user_id=schema.user_id,
        title="Marks Published",
        content=f"Your grades for {subject.name} ({subject.code}) have been published by the instructor."
    )
    db.add(notif)
    
    db.commit()
    db.refresh(new_mark)
    return new_mark


@router.put("/{mark_id}", response_model=MarkResponse)
def update_mark(
    mark_id: int,
    schema: MarkUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark record not found")

    if current_user["role"] == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == mark.subject_id, Subject.teacher_id == current_user["id"]).first()
        if not subject:
            raise HTTPException(status_code=403, detail="Access denied. You do not teach this subject.")
        
    update_data = schema.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(mark, field, val)
        
    total, average, percentage, grade = calculate_grade_metrics(
        mark.quiz, mark.assignment, mark.lab, mark.internal, mark.mid_exam, mark.practical, mark.final
    )
    
    mark.total = total
    mark.average = average
    mark.percentage = percentage
    mark.grade = grade
    
    # Notify student
    notif = Notification(
        user_id=mark.user_id,
        title="Marks Updated",
        content=f"Your grades for {mark.subject.name} have been updated."
    )
    db.add(notif)
    
    db.commit()
    db.refresh(mark)
    return mark


@router.get("/student/{student_id}", response_model=List[MarkResponse])
def get_student_marks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req_user_id = int(current_user["user_id"])
    req_role = current_user["role"]
    
    if req_role == UserRole.STUDENT and req_user_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own grades.")

    if req_role == UserRole.TEACHER:
        taught_subjects = db.query(Subject.id).filter(Subject.teacher_id == req_user_id).all()
        subject_ids = [subject_id for (subject_id,) in taught_subjects]
        if not subject_ids:
            return []
        return db.query(Mark).filter(Mark.user_id == student_id, Mark.subject_id.in_(subject_ids)).all()
        
    return db.query(Mark).filter(Mark.user_id == student_id).all()


@router.get("/my", response_model=List[MarkResponse])
def get_my_marks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req_user_id = int(current_user["user_id"])
    return db.query(Mark).filter(Mark.user_id == req_user_id).all()
