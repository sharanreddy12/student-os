from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, subjects, timetable, assignments, attendance, notes, assistant, analytics

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudentOS API", version="1.0.0")

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
app.include_router(subjects.router, prefix="/api/v1")
app.include_router(timetable.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(assistant.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "StudentOS API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
