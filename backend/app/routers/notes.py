from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Note, Subject, UserRole, Notification
from app.schemas import NoteCreate, NoteUpdate, NoteListResponse, NoteResponse
from app.dependencies import get_current_user
from app.services.rag_pipeline import embed_and_store

router = APIRouter(prefix="/notes", tags=["notes"])


def _serialize_note(note: Note) -> dict:
    return {
        "id": note.id,
        "subject_id": note.subject_id,
        "title": note.title,
        "content": note.content,
        "unit": note.unit,
        "topic": note.topic,
        "file_type": note.file_type,
        "file_url": note.file_url,
        "created_at": note.created_at or datetime.now(timezone.utc),
        "updated_at": note.updated_at or note.created_at or datetime.now(timezone.utc),
    }


@router.get("", response_model=List[NoteListResponse])
def get_notes(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.STUDENT:
        # Students see notes for all subjects they are enrolled in
        from app.models import StudentSubject
        enrolled_subjects = db.query(StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).all()
        subject_ids = [s[0] for s in enrolled_subjects]
        query = db.query(Note).filter(Note.subject_id.in_(subject_ids))
    elif role == UserRole.TEACHER:
        # Teachers see notes they uploaded
        query = db.query(Note).filter(Note.user_id == user_id)
    else:
        # Admins see all
        query = db.query(Note)
        
    if subject_id:
        query = query.filter(Note.subject_id == subject_id)

    notes = query.order_by(Note.created_at.desc()).all()
    return [
        {
            "id": note.id,
            "subject_id": note.subject_id,
            "title": note.title,
            "unit": note.unit,
            "topic": note.topic,
            "file_type": note.file_type,
            "file_url": note.file_url,
            "updated_at": note.updated_at or note.created_at or datetime.now(timezone.utc),
        }
        for note in notes
    ]


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    # Check permissions
    if role == UserRole.STUDENT:
        from app.models import StudentSubject
        enrolled = db.query(StudentSubject).filter(StudentSubject.subject_id == note.subject_id, StudentSubject.student_id == user_id).first()
        if not enrolled:
            raise HTTPException(status_code=403, detail="Access denied. You are not enrolled in this subject.")
    elif role == UserRole.TEACHER:
        if note.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied. You do not own this note.")

    return _serialize_note(note)


@router.post("", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    # Check permissions (only teacher or above can create notes)
    if role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot upload notes.")

    # Verify subject exists
    subject_query = db.query(Subject).filter(Subject.id == note_data.subject_id)
    if role == UserRole.TEACHER:
        subject_query = subject_query.filter(Subject.teacher_id == user_id)
    subject = subject_query.first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")
        
    new_note = Note(
        user_id=user_id,
        subject_id=note_data.subject_id,
        title=note_data.title.strip(),
        content=note_data.content,
        unit=note_data.unit.strip() if note_data.unit else None,
        topic=note_data.topic.strip() if note_data.topic else None,
        file_type=note_data.file_type.strip() if note_data.file_type else None,
        file_url=note_data.file_url.strip() if note_data.file_url else None
    )
    db.add(new_note)
    
    # Send notification to all students enrolled in this subject code
    enrolled_students = db.query(Subject.user_id).filter(
        Subject.code == subject.code,
        Subject.is_active == True
    ).all()
    
    for student_row in enrolled_students:
        notif = Notification(
            user_id=student_row[0],
            title="New Study Materials",
            content=f"Instructor {current_user['name']} uploaded a new note: '{note_data.title}' for {subject.name}."
        )
        db.add(notif)
        
    db.commit()
    db.refresh(new_note)

    # Trigger embedding pipeline in background
    background_tasks.add_task(embed_and_store, new_note.id, db)

    return _serialize_note(new_note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if role == UserRole.TEACHER and note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this note.")
        
    update_data = note_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
        
    db.commit()
    db.refresh(note)

    if "content" in update_data:
        background_tasks.add_task(embed_and_store, note.id, db)

    return _serialize_note(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if role == UserRole.TEACHER and note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this note.")
        
    db.delete(note)
    db.commit()
