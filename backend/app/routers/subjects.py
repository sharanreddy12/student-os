from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List, Optional
from app.database import get_db
from app.models import Subject, StudentSubject, User, UserRole, Attendance, Mark, Assignment
from app.schemas import SubjectCreate, SubjectUpdate, SubjectResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/subjects", tags=["subjects"])


def _enrich_subject_stats(subject, db):
    """Add computed stats to a subject."""
    student_count = db.query(StudentSubject).filter(
        StudentSubject.subject_id == subject.id,
        StudentSubject.is_active == True
    ).count()
    
    # Count present vs total attendance without relying on a DB enum comparison
    attendance_rows = db.query(Attendance).filter(
        Attendance.subject_id == subject.id
    ).all()
    total_att = len(attendance_rows)
    present_att = sum(
        1 for record in attendance_rows
        if str(getattr(record, "status", "")).lower() in {"present", "late"}
    )
    avg_attendance = (present_att / total_att * 100) if total_att > 0 else 0
    
    avg_marks = db.query(sqlfunc.avg(Mark.percentage)).filter(
        Mark.subject_id == subject.id
    ).scalar() or 0
    
    pending = db.query(Assignment).filter(
        Assignment.subject_id == subject.id,
        Assignment.status.in_(["todo", "in_progress"])
    ).count()
    
    return {
        "student_count": student_count,
        "avg_attendance": round(float(avg_attendance), 1),
        "avg_marks": round(float(avg_marks or 0), 1),
        "pending_assignments": pending
    }


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    search: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.TEACHER:
        query = db.query(Subject).filter(Subject.teacher_id == user_id)
    elif role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        query = db.query(Subject)
    else:
        from app.models import StudentSubject
        query = db.query(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
    
    # Filters
    if search:
        query = query.filter(
            (Subject.name.ilike(f"%{search}%")) |
            (Subject.code.ilike(f"%{search}%"))
        )
    if semester:
        query = query.filter(Subject.semester == semester)
    if department:
        query = query.filter(Subject.department.ilike(f"%{department}%"))
    if status_filter:
        is_active = status_filter.lower() == "active"
        query = query.filter(Subject.is_active == is_active)
    
    total = query.count()
    subjects = query.order_by(Subject.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    # Enrich with stats
    result = []
    for s in subjects:
        stats = _enrich_subject_stats(s, db)
        resp = SubjectResponse(
            id=s.id, user_id=s.user_id, teacher_id=s.teacher_id,
            name=s.name, code=s.code, department=s.department,
            semester=s.semester, credits=s.credits, section=getattr(s, 'section', None),
            classroom=s.classroom, color=s.color,
            minimum_attendance_percentage=s.minimum_attendance_percentage,
            description=s.description, is_active=s.is_active,
            academic_year=getattr(s, 'academic_year', None),
            created_at=s.created_at, updated_at=s.updated_at,
            **stats
        )
        result.append(resp)
    return result


@router.get("/all", response_model=List[SubjectResponse])
def get_all_subjects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all subjects for dropdowns - no pagination."""
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.TEACHER:
        subjects = db.query(Subject).filter(Subject.teacher_id == user_id).order_by(Subject.name).all()
    elif role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subjects = db.query(Subject).order_by(Subject.name).all()
    else:
        from app.models import StudentSubject
        subjects = db.query(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).order_by(Subject.name).all()
    
    result = []
    for s in subjects:
        try:
            stats = _enrich_subject_stats(s, db)
        except Exception:
            # Ensure a single bad subject doesn't crash the entire list
            stats = {"student_count": 0, "avg_attendance": 0.0, "avg_marks": 0.0, "pending_assignments": 0}
        resp = SubjectResponse(
            id=s.id, user_id=s.user_id, teacher_id=s.teacher_id,
            name=s.name, code=s.code, department=s.department,
            semester=s.semester, credits=s.credits, section=getattr(s, 'section', None),
            classroom=s.classroom, color=s.color,
            minimum_attendance_percentage=s.minimum_attendance_percentage,
            description=s.description, is_active=s.is_active,
            academic_year=getattr(s, 'academic_year', None),
            created_at=s.created_at, updated_at=s.updated_at,
            **stats
        )
        result.append(resp)
    return result


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    # Teachers create subjects assigned to themselves
    subject_user_id = user_id
    teacher_id = user_id if role == UserRole.TEACHER else None
    
    existing = db.query(Subject).filter(
        Subject.teacher_id == teacher_id,
        Subject.code == subject_data.code.strip().upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subject code already exists"
        )
    
    new_subject = Subject(
        user_id=subject_user_id,
        teacher_id=teacher_id,
        name=subject_data.name.strip(),
        code=subject_data.code.strip().upper(),
        department=subject_data.department,
        semester=subject_data.semester,
        credits=subject_data.credits,
        section=subject_data.section,
        classroom=subject_data.classroom,
        color=subject_data.color.strip() if subject_data.color else "#3b82f6",
        minimum_attendance_percentage=subject_data.minimum_attendance_percentage,
        description=subject_data.description,
        is_active=subject_data.is_active,
    )
    if hasattr(new_subject, 'academic_year') and subject_data.academic_year:
        new_subject.academic_year = subject_data.academic_year
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    stats = _enrich_subject_stats(new_subject, db)
    return SubjectResponse(
        id=new_subject.id, user_id=new_subject.user_id, teacher_id=new_subject.teacher_id,
        name=new_subject.name, code=new_subject.code, department=new_subject.department,
        semester=new_subject.semester, credits=new_subject.credits, section=getattr(new_subject, 'section', None),
        classroom=new_subject.classroom, color=new_subject.color,
        minimum_attendance_percentage=new_subject.minimum_attendance_percentage,
        description=new_subject.description, is_active=new_subject.is_active,
        academic_year=getattr(new_subject, 'academic_year', None),
        created_at=new_subject.created_at, updated_at=new_subject.updated_at,
        **stats
    )


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == user_id).first()
    elif role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
    elif role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject = db.query(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(Subject.id == subject_id, StudentSubject.student_id == user_id).first()
    else:
        subject = None
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    stats = _enrich_subject_stats(subject, db)
    return SubjectResponse(
        id=subject.id, user_id=subject.user_id, teacher_id=subject.teacher_id,
        name=subject.name, code=subject.code, department=subject.department,
        semester=subject.semester, credits=subject.credits, section=getattr(subject, 'section', None),
        classroom=subject.classroom, color=subject.color,
        minimum_attendance_percentage=subject.minimum_attendance_percentage,
        description=subject.description, is_active=subject.is_active,
        academic_year=getattr(subject, 'academic_year', None),
        created_at=subject.created_at, updated_at=subject.updated_at,
        **stats
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]

    if role == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == user_id).first()
    elif role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
    elif role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject = db.query(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(Subject.id == subject_id, StudentSubject.student_id == user_id).first()
    else:
        subject = None
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    update_data = subject_data.model_dump(exclude_unset=True)
    
    # Handle code normalization
    if "code" in update_data and update_data["code"] is not None:
        normalized_code = str(update_data["code"]).strip().upper()
        conflict = db.query(Subject).filter(
            Subject.code == normalized_code,
            Subject.id != subject_id,
            Subject.teacher_id == (subject.teacher_id or user_id)
        ).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Subject code already exists")
        update_data["code"] = normalized_code

    for field, value in update_data.items():
        if value is not None:
            setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    
    stats = _enrich_subject_stats(subject, db)
    return SubjectResponse(
        id=subject.id, user_id=subject.user_id, teacher_id=subject.teacher_id,
        name=subject.name, code=subject.code, department=subject.department,
        semester=subject.semester, credits=subject.credits, section=getattr(subject, 'section', None),
        classroom=subject.classroom, color=subject.color,
        minimum_attendance_percentage=subject.minimum_attendance_percentage,
        description=subject.description, is_active=subject.is_active,
        academic_year=getattr(subject, 'academic_year', None),
        created_at=subject.created_at, updated_at=subject.updated_at,
        **stats
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]

    if role == UserRole.TEACHER:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == user_id).first()
    elif role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
    elif role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject = db.query(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(Subject.id == subject_id, StudentSubject.student_id == user_id).first()
    else:
        subject = None
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    # Soft delete
    subject.is_active = False
    db.commit()