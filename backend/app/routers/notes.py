from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Note, Subject
from app.schemas import NoteCreate, NoteUpdate, NoteListResponse, NoteResponse
from app.dependencies import get_current_user
from app.services.rag_pipeline import embed_and_store

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=List[NoteListResponse])
def get_notes(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    query = db.query(Note).filter(Note.user_id == user_id)
    
    if subject_id:
        query = query.filter(Note.subject_id == subject_id)
    
    notes = query.order_by(Note.updated_at.desc()).all()
    return notes


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    return note


@router.post("", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == note_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    new_note = Note(
        user_id=user_id,
        subject_id=note_data.subject_id,
        title=note_data.title,
        content=note_data.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    # Trigger embedding pipeline in background
    background_tasks.add_task(embed_and_store, new_note.id, db)
    
    return new_note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    update_data = note_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.commit()
    db.refresh(note)
    
    # Re-trigger embedding pipeline in background if content changed
    if "content" in update_data:
        background_tasks.add_task(embed_and_store, note.id, db)
    
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    db.delete(note)
    db.commit()
