from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Announcement, Subject, User, UserRole, Notification
from app.schemas import AnnouncementCreate, AnnouncementResponse
from app.dependencies import get_current_user, teacher_or_above

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    schema: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(teacher_or_above)
):
    teacher_id = int(current_user["user_id"])
    
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == schema.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    new_announcement = Announcement(
        subject_id=schema.subject_id,
        teacher_id=teacher_id,
        title=schema.title.strip(),
        content=schema.content.strip()
    )
    db.add(new_announcement)
    
    # Notify all students enrolled in this subject
    enrolled_students = db.query(Subject.user_id).filter(
        Subject.code == subject.code,
        Subject.is_active == True
    ).all()
    
    for student_row in enrolled_students:
        notif = Notification(
            user_id=student_row[0],
            title=f"New Announcement: {schema.title}",
            content=f"New announcement posted in {subject.name}: {schema.content[:80]}..."
        )
        db.add(notif)
        
    db.commit()
    db.refresh(new_announcement)
    return new_announcement


@router.get("/subject/{subject_id}", response_model=List[AnnouncementResponse])
def get_subject_announcements(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    return db.query(Announcement).filter(Announcement.subject_id == subject_id).order_by(Announcement.created_at.desc()).all()


@router.get("/my", response_model=List[AnnouncementResponse])
def get_my_announcements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
    if role == UserRole.STUDENT:
        # Fetch announcements for all subjects student is enrolled in
        from app.models import StudentSubject
        enrolled_subjects = db.query(StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).all()
        subject_ids = [s[0] for s in enrolled_subjects]
        return db.query(Announcement).filter(Announcement.subject_id.in_(subject_ids)).order_by(Announcement.created_at.desc()).all()
    elif role == UserRole.TEACHER:
        # Fetch announcements created by this teacher
        return db.query(Announcement).filter(Announcement.teacher_id == user_id).order_by(Announcement.created_at.desc()).all()
    else:
        # Admins/Super Admins see all announcements
        return db.query(Announcement).order_by(Announcement.created_at.desc()).all()
