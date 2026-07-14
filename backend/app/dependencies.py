from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import decode_token
from app.models import User, UserRole, UserStatus

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or retired"
        )
    
    return {
        "id": user.id,
        "user_id": str(user.id),
        "student_id": user.student_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "user_obj": user
    }


class RequireMinRole:
    def __init__(self, min_role: UserRole):
        self.min_role = min_role
        self.hierarchy = {
            UserRole.SUPER_ADMIN: 4,
            UserRole.ADMIN: 3,
            UserRole.TEACHER: 2,
            UserRole.STUDENT: 1
        }

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user["role"]
        if self.hierarchy[role] < self.hierarchy[self.min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access this resource"
            )
        return current_user


teacher_or_above = RequireMinRole(UserRole.TEACHER)
admin_or_above = RequireMinRole(UserRole.ADMIN)
super_admin_only = RequireMinRole(UserRole.SUPER_ADMIN)
