from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List
from app.database import get_db
from app.models import StudentSubject, Subject, User, UserRole, UserStatus
from app.schemas import StudentSubjectAssign, StudentSubjectResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/student-subjects", tags=["student-subjects"])


@router.get("", response_model=List[StudentSubjectResponse])
def list_student_subjects(
    subject_id: int = None,
    student_id: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    query = db.query(StudentSubject)
    
    if role == UserRole.TEACHER:
        # Teachers see only their own assignments
        query = query.filter(StudentSubject.teacher_id == user_id)
    elif role == UserRole.STUDENT:
        query = query.filter(StudentSubject.student_id == user_id)
    
    if subject_id:
        query = query.filter(StudentSubject.subject_id == subject_id)
    if student_id:
        query = query.filter(StudentSubject.student_id == student_id)
    
    records = query.order_by(StudentSubject.created_at.desc()).all()
    
    result = []
    for r in records:
        student = db.query(User).filter(User.id == r.student_id).first()
        subject = db.query(Subject).filter(Subject.id == r.subject_id).first()
        result.append(StudentSubjectResponse(
            id=r.id,
            student_id=r.student_id,
            subject_id=r.subject_id,
            teacher_id=r.teacher_id,
            semester=r.semester,
            section=r.section,
            academic_year=r.academic_year,
            assignment_date=r.assignment_date,
            is_active=r.is_active,
            student_name=student.name if student else None,
            student_email=student.email if student else None,
            student_roll_number=student.roll_number if student else None,
            subject_name=subject.name if subject else None,
            subject_code=subject.code if subject else None,
        ))
    return result


@router.post("", response_model=StudentSubjectResponse, status_code=status.HTTP_201_CREATED)
def assign_student_to_subject(
    data: StudentSubjectAssign,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers and admins can assign subjects")
    
    # Verify student exists
    student = db.query(User).filter(User.id == data.student_id, User.role == UserRole.STUDENT, User.status == UserStatus.ACTIVE).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Verify subject exists
    if role == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.teacher_id == user_id).first()
    else:
        subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    # Check duplicate
    existing = db.query(StudentSubject).filter(
        StudentSubject.student_id == data.student_id,
        StudentSubject.subject_id == data.subject_id,
        StudentSubject.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student already assigned to this subject")
    
    new_assignment = StudentSubject(
        student_id=data.student_id,
        subject_id=data.subject_id,
        teacher_id=user_id if role == UserRole.TEACHER else subject.teacher_id,
        semester=data.semester or student.semester,
        section=data.section or student.section,
        academic_year=data.academic_year,
        is_active=True,
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    return StudentSubjectResponse(
        id=new_assignment.id,
        student_id=new_assignment.student_id,
        subject_id=new_assignment.subject_id,
        teacher_id=new_assignment.teacher_id,
        semester=new_assignment.semester,
        section=new_assignment.section,
        academic_year=new_assignment.academic_year,
        assignment_date=new_assignment.assignment_date,
        is_active=new_assignment.is_active,
        student_name=student.name,
        student_email=student.email,
        student_roll_number=student.roll_number,
        subject_name=subject.name,
        subject_code=subject.code,
    )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_from_subject(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    query = db.query(StudentSubject).filter(StudentSubject.id == assignment_id)
    if role == UserRole.TEACHER:
        query = query.filter(StudentSubject.teacher_id == user_id)
    
    assignment = query.first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    assignment.is_active = False
    db.commit()


@router.get("/students/{subject_id}", response_model=List[dict])
def get_subject_students(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all students assigned to a subject."""
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    # Verify subject access
    if role == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == user_id).first()
    else:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    assignments = db.query(StudentSubject).filter(
        StudentSubject.subject_id == subject_id,
        StudentSubject.is_active == True
    ).all()
    
    students = []
    for a in assignments:
        s = db.query(User).filter(User.id == a.student_id).first()
        if s:
            students.append({
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "roll_number": s.roll_number,
                "department": s.department,
                "semester": s.semester or a.semester,
                "section": s.section or a.section,
                "phone": s.phone,
                "photo": s.photo,
                "status": s.status.value if s.status else "ACTIVE",
                "assignment_id": a.id,
                "academic_year": a.academic_year,
            })
    
    return students