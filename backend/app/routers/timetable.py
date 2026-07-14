from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Subject, TimetableEntry, UserRole
from app.schemas import TimetableCreate, TimetableResponse, TimetableUpdate

router = APIRouter(prefix="/timetable", tags=["timetable"])


def _time_to_minutes(value: str) -> int:
    hour, minute = map(int, value.split(":"))
    return hour * 60 + minute


def _ensure_valid_time_window(start_time: str, end_time: str) -> None:
    if _time_to_minutes(start_time) >= _time_to_minutes(end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )


def _get_user_timetable_query(db: Session, user_id: int, role: str):
    if role == UserRole.TEACHER:
        return db.query(TimetableEntry).join(Subject).filter(Subject.teacher_id == user_id)
    elif role == UserRole.STUDENT:
        from app.models import StudentSubject
        return db.query(TimetableEntry).join(Subject).join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
    else:
        # Admins see all
        return db.query(TimetableEntry).join(Subject)


def check_time_conflict(
    db: Session,
    user_id: int,
    role: str,
    day_of_week: int,
    start_time: str,
    end_time: str,
    exclude_id: int = None,
):
    """Check for time conflicts in timetable."""
    query = _get_user_timetable_query(db, user_id, role).filter(
        TimetableEntry.day_of_week == day_of_week,
        TimetableEntry.is_active.is_(True),
    )

    if exclude_id is not None:
        query = query.filter(TimetableEntry.id != exclude_id)

    entries = query.all()

    for entry in entries:
        if start_time < entry.end_time and end_time > entry.start_time:
            return entry

    return None


@router.get("", response_model=List[TimetableResponse])
def get_timetable(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    entries = _get_user_timetable_query(db, user_id, role).order_by(
        TimetableEntry.day_of_week,
        TimetableEntry.start_time,
    ).all()
    return entries


@router.get("/today", response_model=List[TimetableResponse])
def get_timetable_today(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    today = datetime.now().weekday()
    entries = (
        _get_user_timetable_query(db, user_id, role)
        .filter(TimetableEntry.day_of_week == today, TimetableEntry.is_active.is_(True))
        .order_by(TimetableEntry.start_time)
        .all()
    )
    return entries


@router.get("/next", response_model=Optional[TimetableResponse])
def get_next_timetable_entry(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    now = datetime.now()
    current_day = now.weekday()
    current_time = now.strftime("%H:%M")

    entries = (
        _get_user_timetable_query(db, user_id, role)
        .filter(TimetableEntry.is_active.is_(True))
        .order_by(TimetableEntry.day_of_week, TimetableEntry.start_time)
        .all()
    )

    if not entries:
        return None

    for offset in range(8):
        day = (current_day + offset) % 7
        candidates = [entry for entry in entries if entry.day_of_week == day]
        if not candidates:
            continue
        if offset == 0:
            candidates = [entry for entry in candidates if _time_to_minutes(entry.start_time) >= _time_to_minutes(current_time)]
        if candidates:
            candidates.sort(key=lambda entry: entry.start_time)
            return candidates[0]

    return None


@router.post("", response_model=TimetableResponse)
def create_timetable_entry(
    entry_data: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]

    _ensure_valid_time_window(entry_data.start_time, entry_data.end_time)

    # Allow Teachers or Admins to assign subjects to timetables
    subject_query = db.query(Subject).filter(Subject.id == entry_data.subject_id)
    if role == UserRole.TEACHER:
        subject_query = subject_query.filter(Subject.teacher_id == user_id)
    elif role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject_query = subject_query.join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
        
    subject = subject_query.first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    conflict = check_time_conflict(
        db,
        user_id,
        role,
        entry_data.day_of_week,
        entry_data.start_time,
        entry_data.end_time,
    )

    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time conflict with existing entry")

    new_entry = TimetableEntry(
        subject_id=entry_data.subject_id,
        day_of_week=entry_data.day_of_week,
        start_time=entry_data.start_time,
        end_time=entry_data.end_time,
        location=entry_data.location,
        faculty_name=entry_data.faculty_name or subject.faculty_name,
        building=entry_data.building,
        class_type=entry_data.class_type,
        recurrence=entry_data.recurrence,
        notes=entry_data.notes,
        is_active=entry_data.is_active,
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
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]

    entry = _get_user_timetable_query(db, user_id, role).filter(TimetableEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable entry not found")

    update_data = entry_data.model_dump(exclude_unset=True)

    if "subject_id" in update_data:
        subject_query = db.query(Subject).filter(Subject.id == update_data["subject_id"])
        if role == UserRole.TEACHER:
            subject_query = subject_query.filter(Subject.teacher_id == user_id)
        elif role == UserRole.STUDENT:
            from app.models import StudentSubject
            subject_query = subject_query.join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
            
        subject = subject_query.first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if "day_of_week" in update_data or "start_time" in update_data or "end_time" in update_data:
        day = update_data.get("day_of_week", entry.day_of_week)
        start = update_data.get("start_time", entry.start_time)
        end = update_data.get("end_time", entry.end_time)
        _ensure_valid_time_window(start, end)

        conflict = check_time_conflict(db, user_id, role, day, start, end, exclude_id=entry_id)
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Time conflict with existing entry")

    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]

    entry = _get_user_timetable_query(db, user_id, role).filter(TimetableEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable entry not found")

    db.delete(entry)
    db.commit()
