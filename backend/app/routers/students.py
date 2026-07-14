from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.database import get_db
from app.models import User, UserRole, UserStatus, Subject, StudentSubject
from app.schemas import StudentCreate, StudentUpdate, UserResponse, SubjectCreate, SubjectResponse
from app.auth import get_password_hash
from app.dependencies import RequireMinRole

router = APIRouter(prefix="/students", tags=["students"])

# Enforce Teacher or above role access for Student management
teacher_or_above = RequireMinRole(UserRole.TEACHER)


@router.post("", response_model=UserResponse)
def create_student(
    schema: StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    # Check email unique
    existing_email = db.query(User).filter(User.email == schema.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Check roll number unique
    existing_roll = db.query(User).filter(User.roll_number == schema.roll_number).first()
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already registered"
        )
        
    # Check admission number unique
    if schema.admission_number is not None:
        existing_admission = db.query(User).filter(User.admission_number == schema.admission_number).first()
        if existing_admission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admission number already registered"
            )
    
    hashed = get_password_hash(schema.password)
    new_user = User(
        name=schema.name,
        email=schema.email,
        password_hash=hashed,
        role=UserRole.STUDENT,
        status=UserStatus.ACTIVE,
        created_by=current_user["id"],
        roll_number=schema.roll_number,
        department=schema.department,
        semester=schema.semester,
        section=schema.section,
        year=schema.year,
        batch=schema.batch,
        admission_number=schema.admission_number,
        phone=schema.phone,
        parent_name=schema.parent_name,
        parent_phone=schema.parent_phone,
        guardian=schema.guardian,
        photo=schema.photo,
        student_id=schema.roll_number  # Maintain backward compatibility
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("", response_model=List[UserResponse])
def list_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    return query.order_by(User.name).all()


@router.put("/{id}", response_model=UserResponse)
def update_student(
    id: int,
    schema: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    # If Teacher, check authorization to edit this student
    user = db.query(User).filter(User.id == id, User.role == UserRole.STUDENT).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    if current_user["role"] == UserRole.TEACHER:
        student_subjects = db.query(StudentSubject.student_id).filter(
            StudentSubject.teacher_id == current_user["id"],
            StudentSubject.is_active == True,
        ).all()
        student_ids_via_subjects = [student_id for (student_id,) in student_subjects]
        is_assigned = (user.created_by == current_user["id"]) or (id in student_ids_via_subjects)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your assigned students."
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
    if schema.roll_number is not None:
        if schema.roll_number != user.roll_number:
            existing = db.query(User).filter(User.roll_number == schema.roll_number).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Roll number already registered"
                )
        user.roll_number = schema.roll_number
        user.student_id = schema.roll_number
    if schema.department is not None:
        user.department = schema.department
    if schema.semester is not None:
        user.semester = schema.semester
    if schema.section is not None:
        user.section = schema.section
    if schema.status is not None:
        user.status = schema.status
        
    # Extended profile updates
    if schema.year is not None:
        user.year = schema.year
    if schema.batch is not None:
        user.batch = schema.batch
    if schema.admission_number is not None:
        if schema.admission_number != user.admission_number:
            existing = db.query(User).filter(User.admission_number == schema.admission_number).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admission number already registered"
                )
        user.admission_number = schema.admission_number
    if schema.phone is not None:
        user.phone = schema.phone
    if schema.parent_name is not None:
        user.parent_name = schema.parent_name
    if schema.parent_phone is not None:
        user.parent_phone = schema.parent_phone
    if schema.guardian is not None:
        user.guardian = schema.guardian
    if schema.photo is not None:
        user.photo = schema.photo
        
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{id}/deactivate", response_model=UserResponse)
def deactivate_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    user = db.query(User).filter(User.id == id, User.role == UserRole.STUDENT).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    if current_user["role"] == UserRole.TEACHER:
        student_subjects = db.query(StudentSubject.student_id).filter(
            StudentSubject.teacher_id == current_user["id"],
            StudentSubject.is_active == True,
        ).all()
        student_ids_via_subjects = [student_id for (student_id,) in student_subjects]
        is_assigned = (user.created_by == current_user["id"]) or (id in student_ids_via_subjects)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only deactivate your assigned students."
            )
            
    user.status = UserStatus.INACTIVE
    db.commit()
    db.refresh(user)
    return user


# Teacher assigns a subject to a student
@router.post("/{student_id}/subjects", response_model=SubjectResponse)
def assign_subject_to_student(
    student_id: int,
    subject_schema: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    # Check if subject code already exists for this student
    existing = db.query(Subject).filter(
        Subject.user_id == student_id,
        Subject.code == subject_schema.code.strip().upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subject code already exists for this student"
        )
        
    new_subject = Subject(
        user_id=student_id,
        teacher_id=current_user["id"],
        name=subject_schema.name.strip(),
        code=subject_schema.code.strip().upper(),
        department=subject_schema.department.strip() if subject_schema.department else None,
        semester=subject_schema.semester,
        credits=subject_schema.credits,
        faculty_name=subject_schema.faculty_name.strip() if subject_schema.faculty_name else current_user["name"],
        classroom=subject_schema.classroom.strip() if subject_schema.classroom else None,
        color=subject_schema.color.strip(),
        minimum_attendance_percentage=subject_schema.minimum_attendance_percentage,
        description=subject_schema.description.strip() if subject_schema.description else None,
        is_active=subject_schema.is_active
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject
