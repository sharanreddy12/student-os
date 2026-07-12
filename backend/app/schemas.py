from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


# Subject Schemas
class SubjectCreate(BaseModel):
    name: str
    code: str
    color: str


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    color: Optional[str] = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    color: str
    
    class Config:
        from_attributes = True


# Timetable Schemas
class TimetableCreate(BaseModel):
    subject_id: int
    day_of_week: int  # 0=Mon..6=Sun
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    location: Optional[str] = None


class TimetableUpdate(BaseModel):
    subject_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None


class TimetableResponse(BaseModel):
    id: int
    subject_id: int
    day_of_week: int
    start_time: str
    end_time: str
    location: Optional[str] = None
    
    class Config:
        from_attributes = True


# Note Schemas
class NoteCreate(BaseModel):
    subject_id: int
    title: str
    content: str


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class NoteListResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NoteResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Assignment Schemas
class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "medium"  # low, medium, high


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None  # todo, in_progress, done
    priority: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    status: str
    priority: str
    
    class Config:
        from_attributes = True


# Attendance Schemas
class AttendanceCreate(BaseModel):
    subject_id: int
    date: datetime
    status: str  # present, absent, excused


class AttendanceResponse(BaseModel):
    id: int
    subject_id: int
    date: datetime
    status: str
    
    class Config:
        from_attributes = True


class AttendanceSummaryResponse(BaseModel):
    subject_id: int
    percentage: float
    total_classes: int
    attended: int


# AI Assistant Schemas
class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    citations: List[dict]


class SummarizeRequest(BaseModel):
    subject_id: int


class SummarizeResponse(BaseModel):
    summary: str


class QuizRequest(BaseModel):
    subject_id: int
    topic: Optional[str] = None


class QuizResponse(BaseModel):
    questions: List[dict]


# Analytics Schemas
class AttendanceRiskResponse(BaseModel):
    subject_id: int
    risk_score: float
    reason: str


class StudyPatternsResponse(BaseModel):
    notes_per_subject: List[dict]
    assignment_completion_rate: List[dict]
    note_frequency_over_time: List[dict]


# Error Response
class ErrorResponse(BaseModel):
    detail: str
