from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, subjects, timetable, assignments, attendance, notes, assistant, analytics, marks, announcements, notifications, student_subjects
from app.routers import super_admins, admins, teachers, students
from app.models import User, UserRole, UserStatus
from app.auth import get_password_hash
import logging
from fastapi import Request, HTTPException
import traceback

# configure basic logging
logging.basicConfig(level=logging.INFO)

# Create tables (guarded so import-time errors don't crash the app)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.exception("Error creating database tables on import: %s", e)

app = FastAPI(title="StudentOS API", version="1.0.0")


@app.middleware("http")
async def log_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except HTTPException:
        # Let FastAPI handle HTTPExceptions
        raise
    except Exception as e:
        logging.exception("Unhandled exception processing request %s %s", request.method, request.url)
        # re-raise as HTTPException to avoid leaking internals
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Check if any SUPER_ADMIN already exists
        super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not super_admin:
            hashed_pw = get_password_hash("admin@1230")
            new_super_admin = User(
                name="Super Admin",
                email="superadmin@admin.com",
                password_hash=hashed_pw,
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE
            )
            db.add(new_super_admin)
            db.commit()
            print("Successfully initialized default Super Admin.")
    except Exception as e:
        print(f"Error during startup initialization: {e}")
    finally:
        db.close()


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(super_admins.router, prefix="/api/v1")
app.include_router(admins.router, prefix="/api/v1")
app.include_router(teachers.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(subjects.router, prefix="/api/v1")
app.include_router(timetable.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(assistant.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(marks.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(student_subjects.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "StudentOS API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
