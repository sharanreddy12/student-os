from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Attendance, Subject, UserRole, User, Notification
from app.schemas import AttendanceCreate, AttendanceResponse, AttendanceSummaryResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("", response_model=List[AttendanceResponse])
def get_attendance(
    subject_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    # Teachers can query specific students or all student records
    if role == UserRole.TEACHER:
        if student_id:
            query = db.query(Attendance).filter(Attendance.user_id == student_id)
        else:
            # Get all attendance records in subjects taught by this teacher
            taught_subjects = db.query(Subject.id).filter(Subject.teacher_id == user_id).all()
            subject_ids = [s[0] for s in taught_subjects]
            query = db.query(Attendance).filter(Attendance.subject_id.in_(subject_ids))
    elif role == UserRole.STUDENT:
        # Students can only view their own attendance
        query = db.query(Attendance).filter(Attendance.user_id == user_id)
    else:
        # Admins/Super Admins
        if student_id:
            query = db.query(Attendance).filter(Attendance.user_id == student_id)
        else:
            query = db.query(Attendance)
            
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
        
    return query.order_by(Attendance.date.desc()).all()


@router.post("", response_model=AttendanceResponse)
def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    target_student_id = attendance_data.student_id
    if role == UserRole.STUDENT:
        # Students can only submit attendance for themselves
        target_student_id = user_id
    elif not target_student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="student_id is required for non-student roles"
        )
        
    subject = db.query(Subject).filter(Subject.id == attendance_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    if role == UserRole.TEACHER and subject.teacher_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not teach this subject."
        )
        
    # Check duplicate entry for date & student & subject
    existing = db.query(Attendance).filter(
        Attendance.user_id == target_student_id,
        Attendance.subject_id == attendance_data.subject_id,
        func.date(Attendance.date) == func.date(attendance_data.date)
    ).first()
    
    if existing:
        # Update existing attendance instead of throwing conflict error for seamless teacher updates
        existing.status = attendance_data.status
        
        notif = Notification(
            user_id=target_student_id,
            title="Attendance Updated",
            content=f"Your attendance for {subject.name} on {attendance_data.date.strftime('%Y-%m-%d')} was updated to '{attendance_data.status}'."
        )
        db.add(notif)
        db.commit()
        db.refresh(existing)
        return existing
        
    new_attendance = Attendance(
        user_id=target_student_id,
        subject_id=attendance_data.subject_id,
        date=attendance_data.date,
        status=attendance_data.status
    )
    db.add(new_attendance)
    
    # Notify student
    notif = Notification(
        user_id=target_student_id,
        title="Attendance Recorded",
        content=f"Your attendance for {subject.name} on {attendance_data.date.strftime('%Y-%m-%d')} has been marked as '{attendance_data.status}'."
    )
    db.add(notif)
    
    db.commit()
    db.refresh(new_attendance)
    return new_attendance


@router.get("/summary", response_model=List[AttendanceSummaryResponse])
def get_attendance_summary(
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    target_student_id = user_id
    if role != UserRole.STUDENT and student_id is not None:
        target_student_id = student_id
            
    rows = db.query(Attendance.subject_id, Attendance.status).filter(
        Attendance.user_id == target_student_id
    ).all()

    summary_map = {}
    for subject_id, status in rows:
        entry = summary_map.setdefault(subject_id, {"total_classes": 0, "attended": 0})
        entry["total_classes"] += 1
        if str(status).lower() in {"present", "late", "on_duty"}:
            entry["attended"] += 1

    summary = []
    for subject_id, values in sorted(summary_map.items()):
        total = values["total_classes"]
        attended = values["attended"]
        percentage = (attended / total * 100) if total > 0 else 0
        summary.append(AttendanceSummaryResponse(
            subject_id=subject_id,
            percentage=round(percentage, 1),
            total_classes=total,
            attended=attended
        ))
        
    return summary
