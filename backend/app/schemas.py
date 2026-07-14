import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


from app.models import UserRole, UserStatus

# Auth Schemas
class UserRegister(BaseModel):
    student_id: Optional[str] = None
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
    student_id: Optional[str] = None
    name: str
    email: str
    role: UserRole
    status: UserStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    year: Optional[int] = None
    batch: Optional[str] = None
    admission_number: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    guardian: Optional[str] = None
    photo: Optional[str] = None
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


# Super Admin Management Schemas
class SuperAdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class SuperAdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: Optional[UserStatus] = None


class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: Optional[UserStatus] = None


class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str
    designation: str


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[UserStatus] = None


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll_number: str
    department: str
    semester: int
    section: str
    year: int = datetime.now().year
    batch: str = str(datetime.now().year)
    admission_number: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    guardian: Optional[str] = None
    photo: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    status: Optional[UserStatus] = None
    year: Optional[int] = None
    batch: Optional[str] = None
    admission_number: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    guardian: Optional[str] = None
    photo: Optional[str] = None


class SubjectCreate(BaseModel):
    name: str
    code: str
    department: Optional[str] = None
    semester: int = 1
    credits: int = 3
    section: Optional[str] = None
    classroom: Optional[str] = None
    color: str = "#3b82f6"
    minimum_attendance_percentage: int = 75
    description: Optional[str] = None
    is_active: bool = True
    academic_year: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Subject name is required")
        if len(value) < 2 or len(value) > 80:
            raise ValueError("Subject name must be between 2 and 80 characters")
        return value

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise ValueError("Subject code is required")
        if len(value) < 2 or len(value) > 20:
            raise ValueError("Subject code must be between 2 and 20 characters")
        return value

    @field_validator("credits")
    @classmethod
    def validate_credits(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Credits must be positive")
        return value

    @field_validator("color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        if value.startswith("#") and len(value) in [4, 7]:
            return value.strip()
        return value.strip()


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    section: Optional[str] = None
    classroom: Optional[str] = None
    color: Optional[str] = None
    minimum_attendance_percentage: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    academic_year: Optional[str] = None


class SubjectResponse(BaseModel):
    id: int
    user_id: int
    teacher_id: Optional[int] = None
    name: str
    code: str
    department: Optional[str] = None
    semester: int
    credits: int
    section: Optional[str] = None
    classroom: Optional[str] = None
    color: str
    minimum_attendance_percentage: int
    description: Optional[str] = None
    is_active: bool
    academic_year: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Additional stats
    student_count: int = 0
    avg_attendance: float = 0
    avg_marks: float = 0
    pending_assignments: int = 0
    
    class Config:
        from_attributes = True


class StudentSubjectAssign(BaseModel):
    student_id: int
    subject_id: int
    semester: Optional[int] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None


class StudentSubjectResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    assignment_date: Optional[datetime] = None
    is_active: bool
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_roll_number: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None

    class Config:
        from_attributes = True


# Timetable Schemas
class TimetableCreate(BaseModel):
    subject_id: int
    day_of_week: int
    start_time: str
    end_time: str
    location: Optional[str] = None
    faculty_name: Optional[str] = None
    building: Optional[str] = None
    class_type: str = "lecture"
    recurrence: str = "weekly"
    notes: Optional[str] = None
    is_active: bool = True

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, value: int) -> int:
        if value < 0 or value > 6:
            raise ValueError("Day of week must be between 0 and 6")
        return value

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):([0-5]\d)", value.strip()):
            raise ValueError("Time must be in HH:MM format")
        return value.strip()

    @field_validator("class_type")
    @classmethod
    def validate_class_type(cls, value: str) -> str:
        value = value.strip().lower()
        allowed = {"lecture", "lab", "tutorial", "seminar", "practice", "exam"}
        if value not in allowed:
            raise ValueError("Class type must be one of lecture, lab, tutorial, seminar, practice, exam")
        return value

    @field_validator("recurrence")
    @classmethod
    def validate_recurrence(cls, value: str) -> str:
        value = value.strip().lower()
        allowed = {"none", "weekly", "biweekly", "custom"}
        if value not in allowed:
            raise ValueError("Recurrence must be one of none, weekly, biweekly, custom")
        return value


class TimetableUpdate(BaseModel):
    subject_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    faculty_name: Optional[str] = None
    building: Optional[str] = None
    class_type: Optional[str] = None
    recurrence: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class TimetableResponse(BaseModel):
    id: int
    subject_id: int
    day_of_week: int
    start_time: str
    end_time: str
    location: Optional[str] = None
    faculty_name: Optional[str] = None
    building: Optional[str] = None
    class_type: str = "lecture"
    recurrence: str = "weekly"
    notes: Optional[str] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True


# Note Schemas
class NoteCreate(BaseModel):
    subject_id: int
    title: str
    content: str
    unit: Optional[str] = None
    topic: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    unit: Optional[str] = None
    topic: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    content: str
    unit: Optional[str] = None
    topic: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    unit: Optional[str] = None
    topic: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "medium"
    max_marks: Optional[float] = 100.0


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None


class AssignmentResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    status: str
    priority: str
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    subject_id: int
    date: datetime
    status: str
    student_id: Optional[int] = None


class AttendanceBulkCreate(BaseModel):
    subject_id: int
    date: datetime
    records: List[dict]


class AttendanceResponse(BaseModel):
    id: int
    user_id: int
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


# Mark Schemas
class MarkCreate(BaseModel):
    user_id: int
    subject_id: int
    quiz: Optional[float] = 0.0
    assignment: Optional[float] = 0.0
    lab: Optional[float] = 0.0
    internal: Optional[float] = 0.0
    mid_exam: Optional[float] = 0.0
    practical: Optional[float] = 0.0
    final: Optional[float] = 0.0


class MarkUpdate(BaseModel):
    quiz: Optional[float] = None
    assignment: Optional[float] = None
    lab: Optional[float] = None
    internal: Optional[float] = None
    mid_exam: Optional[float] = None
    practical: Optional[float] = None
    final: Optional[float] = None


class MarkResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    quiz: float
    assignment: float
    lab: float
    internal: float
    mid_exam: float
    practical: float
    final: float
    total: float
    average: float
    percentage: float
    grade: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


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


# Announcement Schemas
class AnnouncementCreate(BaseModel):
    subject_id: int
    title: str
    content: str


class AnnouncementResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: Optional[int] = None
    title: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Error Response
class ErrorResponse(BaseModel):
    detail: str