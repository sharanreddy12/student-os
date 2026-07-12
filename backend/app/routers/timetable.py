from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import TimetableEntry, Subject
from app.schemas import TimetableCreate, TimetableUpdate, TimetableResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/timetable", tags=["timetable"])


def check_time_conflict(db: Session, user_id: int, day_of_week: int, start_time: str, end_time: str, exclude_id: int = None):
    """Check for time conflicts in timetable"""
    query = db.query(TimetableEntry).join(Subject).filter(
        Subject.user_id == user_id,
        TimetableEntry.day_of_week == day_of_week
    )
    
    if exclude_id:
        query = query.filter(TimetableEntry.id != exclude_id)
    
    entries = query.all()
    
    for entry in entries:
        # Check for overlap
        if (start_time < entry.end_time and end_time > entry.start_time):
            return entry
    
    return None


@router.get("", response_model=List[TimetableResponse])
def get_timetable(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    entries = db.query(TimetableEntry).join(Subject).filter(
        Subject.user_id == user_id
    ).all()
    return entries


@router.post("", response_model=TimetableResponse)
def create_timetable_entry(
    entry_data: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == entry_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check for time conflicts
    conflict = check_time_conflict(
        db, user_id, entry_data.day_of_week,
        entry_data.start_time, entry_data.end_time
    )
    
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Time conflict with existing entry"
        )
    
    new_entry = TimetableEntry(
        subject_id=entry_data.subject_id,
        day_of_week=entry_data.day_of_week,
        start_time=entry_data.start_time,
        end_time=entry_data.end_time,
        location=entry_data.location
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.put("/{entry_id}", response_model=TimetableResponse)
def update_timetable_entry(
    entry_id: int,
    entry_data: TimetableUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    entry = db.query(TimetableEntry).join(Subject).filter(
        TimetableEntry.id == entry_id,
        Subject.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )
    
    update_data = entry_data.model_dump(exclude_unset=True)
    
    # Check for time conflicts if time fields are being updated
    if "day_of_week" in update_data or "start_time" in update_data or "end_time" in update_data:
        day = update_data.get("day_of_week", entry.day_of_week)
        start = update_data.get("start_time", entry.start_time)
        end = update_data.get("end_time", entry.end_time)
        
        conflict = check_time_conflict(db, user_id, day, start, end, exclude_id=entry_id)
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Time conflict with existing entry"
            )
    
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    entry = db.query(TimetableEntry).join(Subject).filter(
        TimetableEntry.id == entry_id,
        Subject.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )
    
    db.delete(entry)
    db.commit()
