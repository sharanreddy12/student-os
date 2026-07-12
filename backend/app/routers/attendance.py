from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import Attendance, Subject
from app.schemas import AttendanceCreate, AttendanceResponse, AttendanceSummaryResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("", response_model=List[AttendanceResponse])
def get_attendance(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    query = db.query(Attendance).filter(Attendance.user_id == user_id)
    
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    
    attendance = query.order_by(Attendance.date.desc()).all()
    return attendance


@router.post("", response_model=AttendanceResponse)
def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == attendance_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check if attendance record already exists for this date and subject
    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.subject_id == attendance_data.subject_id,
        func.date(Attendance.date) == func.date(attendance_data.date)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance record already exists for this date"
        )
    
    new_attendance = Attendance(
        user_id=user_id,
        subject_id=attendance_data.subject_id,
        date=attendance_data.date,
        status=attendance_data.status
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance


@router.get("/summary", response_model=List[AttendanceSummaryResponse])
def get_attendance_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Get attendance summary per subject
    results = db.query(
        Attendance.subject_id,
        func.count(Attendance.id).label("total_classes"),
        func.sum(func.case((Attendance.status == "present", 1), else_=0)).label("attended")
    ).filter(
        Attendance.user_id == user_id
    ).group_by(Attendance.subject_id).all()
    
    summary = []
    for subject_id, total, attended in results:
        percentage = (attended / total * 100) if total > 0 else 0
        summary.append(AttendanceSummaryResponse(
            subject_id=subject_id,
            percentage=round(percentage, 1),
            total_classes=total,
            attended=int(attended)
        ))
    
    return summary
