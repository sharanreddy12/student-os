from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Attendance, Assignment, Note
from app.schemas import AttendanceRiskResponse, StudyPatternsResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/attendance-risk", response_model=List[AttendanceRiskResponse])
def get_attendance_risk(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate attendance risk per subject.
    This is a simplified version - in Phase 5 we'll implement ML-based risk scoring.
    For now, uses simple heuristics.
    """
    user_id = int(current_user["user_id"])
    
    # Get attendance data per subject
    results = db.query(
        Attendance.subject_id,
        func.count(Attendance.id).label("total_classes"),
        func.sum(func.case((Attendance.status == "present", 1), else_=0)).label("attended")
    ).filter(
        Attendance.user_id == user_id
    ).group_by(Attendance.subject_id).all()
    
    risks = []
    for subject_id, total, attended in results:
        percentage = (attended / total * 100) if total > 0 else 0
        
        # Simple risk calculation (will be replaced with ML in Phase 5)
        if percentage >= 90:
            risk_score = 0.1
            reason = "Excellent attendance"
        elif percentage >= 75:
            risk_score = 0.3
            reason = "Good attendance, keep it up"
        elif percentage >= 60:
            risk_score = 0.6
            reason = "Attendance dropping, focus on attending classes"
        else:
            risk_score = 0.9
            reason = "Critical attendance - immediate action required"
        
        risks.append(AttendanceRiskResponse(
            subject_id=subject_id,
            risk_score=risk_score,
            reason=reason
        ))
    
    return risks


@router.get("/study-patterns", response_model=StudyPatternsResponse)
def get_study_patterns(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get study patterns data.
    This is a simplified version - in Phase 5 we'll implement more sophisticated analytics.
    """
    user_id = int(current_user["user_id"])
    
    # Notes per subject
    notes_per_subject = db.query(
        Note.subject_id,
        func.count(Note.id).label("count")
    ).filter(
        Note.user_id == user_id
    ).group_by(Note.subject_id).all()
    
    notes_data = [{"subject_id": sid, "count": count} for sid, count in notes_per_subject]
    
    # Assignment completion rate per subject
    assignment_results = db.query(
        Assignment.subject_id,
        func.count(Assignment.id).label("total"),
        func.sum(func.case((Assignment.status == "done", 1), else_=0)).label("completed")
    ).filter(
        Assignment.user_id == user_id
    ).group_by(Assignment.subject_id).all()
    
    completion_data = []
    for subject_id, total, completed in assignment_results:
        rate = (completed / total * 100) if total > 0 else 0
        completion_data.append({
            "subject_id": subject_id,
            "completion_rate": round(rate, 1),
            "total": total,
            "completed": int(completed)
        })
    
    # Note frequency over time (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    note_frequency = db.query(
        func.date(Note.created_at).label("date"),
        func.count(Note.id).label("count")
    ).filter(
        Note.user_id == user_id,
        Note.created_at >= thirty_days_ago
    ).group_by(func.date(Note.created_at)).all()
    
    frequency_data = [
        {"date": str(date), "count": count}
        for date, count in note_frequency
    ]
    
    return StudyPatternsResponse(
        notes_per_subject=notes_data,
        assignment_completion_rate=completion_data,
        note_frequency_over_time=frequency_data
    )
