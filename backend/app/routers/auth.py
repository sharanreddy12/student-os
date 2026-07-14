from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, UserStatus
from app.schemas import UserLogin, TokenRefresh, UserResponse, AuthResponse
from app.auth import verify_password, create_access_token, create_refresh_token, decode_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register():
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Public registration is disabled. Please contact your administrator."
    )


@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or retired"
        )
    
    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )


@router.post("/refresh")
def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    payload = decode_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    role = payload.get("role")
    email = payload.get("email")
    
    # Verify user still exists
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
    
    # Generate new access token
    access_token = create_access_token(data={"sub": user_id, "email": email, "role": role})
    
    return {"access_token": access_token}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user["user_obj"]
