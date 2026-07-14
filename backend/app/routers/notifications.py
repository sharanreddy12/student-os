from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Notification
from app.schemas import NotificationResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
