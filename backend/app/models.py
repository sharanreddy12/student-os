from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from pgvector.sqlalchemy import Vector
import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    RETIRED = "RETIRED"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, nullable=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Profile fields
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    roll_number = Column(String, unique=True, nullable=True, index=True)
    semester = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    
    # Expanded Student Profile Fields
    year = Column(Integer, nullable=True)
    batch = Column(String, nullable=True)
    admission_number = Column(String, unique=True, nullable=True, index=True)
    phone = Column(String, nullable=True)
    parent_name = Column(String, nullable=True)
    parent_phone = Column(String, nullable=True)
    guardian = Column(String, nullable=True)
    photo = Column(String, nullable=True)
    
    # Relationships
    creator = relationship("User", remote_side=[id], backref="created_users")
    subjects = relationship("Subject", foreign_keys="[Subject.user_id]", back_populates="user", cascade="all, delete-orphan")
    taught_subjects = relationship("Subject", foreign_keys="[Subject.teacher_id]", back_populates="teacher", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="user", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    subject_assignments = relationship("StudentSubject", foreign_keys="[StudentSubject.teacher_id]", back_populates="teacher")


class StudentSubject(Base):
    __tablename__ = "student_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    academic_year = Column(String, nullable=True)
    assignment_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("User", foreign_keys=[student_id], backref="enrolled_subjects")
    subject = relationship("Subject", foreign_keys=[subject_id], backref="enrolled_students")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="subject_assignments")


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    department = Column(String, nullable=True)
    semester = Column(Integer, nullable=False, default=1)
    credits = Column(Integer, nullable=False, default=3)
    faculty_name = Column(String, nullable=True)
    classroom = Column(String, nullable=True)
    color = Column(String, nullable=False)
    minimum_attendance_percentage = Column(Integer, nullable=False, default=75)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", foreign_keys=[user_id], back_populates="subjects")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="taught_subjects")
    timetable_entries = relationship("TimetableEntry", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="subject", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="subject", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="subject", cascade="all, delete-orphan")


class TimetableEntry(Base):
    __tablename__ = "timetable"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    location = Column(String)
    faculty_name = Column(String, nullable=True)
    building = Column(String, nullable=True)
    class_type = Column(String, nullable=False, default="lecture")
    recurrence = Column(String, nullable=False, default="weekly")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    subject = relationship("Subject", back_populates="timetable_entries")


class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum("todo", "in_progress", "done", name="assignment_status"), nullable=False, default="todo")
    priority = Column(Enum("low", "medium", "high", name="assignment_priority"), nullable=False, default="medium")
    marks_obtained = Column(Float, nullable=True)
    max_marks = Column(Float, nullable=True, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum("present", "absent", "excused", name="attendance_status"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="attendance")
    subject = relationship("Subject", back_populates="attendance")


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    unit = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")
    chunks = relationship("NoteChunk", back_populates="note", cascade="all, delete-orphan")


from sqlalchemy.dialects.postgresql import ARRAY


class NoteChunk(Base):
    __tablename__ = "note_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(ARRAY(Float), nullable=True)
    
    note = relationship("Note", back_populates="chunks")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(Enum("user", "assistant", name="chat_role"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ChatSession", back_populates="messages")


class Mark(Base):
    __tablename__ = "marks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    quiz = Column(Float, nullable=True, default=0.0)
    assignment = Column(Float, nullable=True, default=0.0)
    lab = Column(Float, nullable=True, default=0.0)
    internal = Column(Float, nullable=True, default=0.0)
    mid_exam = Column(Float, nullable=True, default=0.0)
    practical = Column(Float, nullable=True, default=0.0)
    final = Column(Float, nullable=True, default=0.0)
    total = Column(Float, nullable=True, default=0.0)
    average = Column(Float, nullable=True, default=0.0)
    percentage = Column(Float, nullable=True, default=0.0)
    grade = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")


class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    subject = relationship("Subject", back_populates="announcements")
    teacher = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="notifications")