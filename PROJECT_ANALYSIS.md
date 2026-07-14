# StudentOS — Comprehensive Pin-to-Pin Analysis

**Project**: AI-powered Academic Management System  
**Status**: MVP with foundational features, RAG pipeline in progress  
**Stack**: React 19 (TanStack Start) + FastAPI + PostgreSQL + AI Integration

---

## 1. ARCHITECTURE OVERVIEW

### High-Level Flow
```
Frontend (TanStack Start + TypeScript)
    ↓
API Client (Token-based Auth)
    ↓
FastAPI Backend (Python 3.11+)
    ↓
Database (PostgreSQL + pgvector)
    ↓
AI Services (Gemini/xAI)
```

### Deployment Model
- **Frontend**: Node.js-based (Vite)
- **Backend**: Python uvicorn ASGI server
- **Database**: PostgreSQL 15+ (containerized option via docker-compose)
- **Optional**: Docker Compose for full stack orchestration

---

## 2. FRONTEND ARCHITECTURE

### Tech Stack
- **Framework**: TanStack Start v1.168.26 (React 19 + TypeScript)
- **Router**: TanStack Router v1.170.16 (file-based routing)
- **State Management**: TanStack Query v5.101.1 (server state)
- **Form Handling**: React Hook Form + resolvers
- **UI Components**: Radix UI + shadcn/ui (pre-built components)
- **Styling**: TailwindCSS 4.2 + custom glass/neon design system
- **Build Tool**: Vite v5.2

### Project Structure
```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts                (API client with token mgmt)
│   ├── components/
│   │   ├── landing/
│   │   │   ├── BootSequence.tsx     (Landing page sequence)
│   │   │   ├── FloatingOS.tsx       (OS-like UI)
│   │   │   └── atoms.tsx            (Landing components)
│   │   └── ui/                      (60+ Radix UI components)
│   ├── contexts/
│   │   └── UserContext.tsx          (Global user state)
│   ├── hooks/
│   │   └── use-mobile.tsx           (Responsive hook)
│   ├── lib/
│   │   ├── utils.ts                 (Utility functions)
│   │   ├── error-capture.ts         (Error handling)
│   │   └── error-reporting.ts
│   ├── routes/
│   │   ├── __root.tsx               (Root layout)
│   │   ├── analytics.tsx            (Analytics page)
│   │   ├── assignments.tsx          (Assignment management)
│   │   ├── attendance.tsx           (Attendance tracking)
│   │   ├── dashboard.tsx            (Main dashboard)
│   │   ├── login.tsx                (Auth page)
│   │   ├── register.tsx             (Registration page)
│   │   ├── notes.tsx                (Notes management)
│   │   ├── timetable.tsx            (Schedule management)
│   │   └── index.tsx                (Home page)
│   ├── router.tsx                   (Router config)
│   └── server.ts                    (Server utilities)
├── vite.config.ts                   (Vite + TanStack Router config)
└── tsconfig.json                    (TypeScript config)
```

### API Client Implementation
**File**: [src/api/client.ts](src/api/client.ts)

```typescript
- Auto token injection in headers
- Token refresh on 401 (automatic retry)
- localStorage persistence (access_token, refresh_token)
- Error normalization
- Base URL: VITE_API_URL or http://localhost:8000/api/v1
```

### Routing Strategy
- File-based routing via TanStack Router
- Authenticated routes use `ssr: false` (client-only rendering) — deliberate trade-off for simplicity
- Single-page app (SPA) for authenticated views

---

## 3. BACKEND ARCHITECTURE

### Tech Stack
- **Framework**: FastAPI v0.115.0 (async ASGI)
- **Database Driver**: psycopg[binary] v3.2.3 (async-ready)
- **ORM**: SQLAlchemy 2.0.35 + Alembic v1.13.3 (migrations)
- **Auth**: python-jose (JWT) + passlib[bcrypt] (password hashing)
- **AI**: google-generativeai v0.8.3, openai v1.54.0
- **Server**: uvicorn[standard] v0.32.0
- **Validation**: Pydantic v2.9.2 + pydantic-settings

### Project Structure
```
backend/
├── app/
│   ├── main.py                      (App factory + CORS + routes)
│   ├── models.py                    (SQLAlchemy models)
│   ├── schemas.py                   (Pydantic request/response models)
│   ├── config.py                    (Environment variables)
│   ├── database.py                  (DB session mgmt)
│   ├── auth.py                      (JWT + password utilities)
│   ├── dependencies.py              (Dependency injection)
│   ├── routers/                     (Route handlers)
│   │   ├── auth.py                  (Register, login, refresh, me)
│   │   ├── subjects.py              (CRUD subjects)
│   │   ├── timetable.py             (Schedule + conflict detection)
│   │   ├── assignments.py           (Assignment tracking)
│   │   ├── attendance.py            (Attendance + summary)
│   │   ├── notes.py                 (Notes + markdown support)
│   │   ├── assistant.py             (AI chat, summarize, quiz)
│   │   └── analytics.py             (Attendance risk + patterns)
│   └── services/
│       ├── ai_client.py             (Provider abstraction)
│       └── rag_pipeline.py          (RAG in progress)
├── alembic/
│   ├── env.py                       (Migration config)
│   ├── script.py.mako               (Migration template)
│   └── versions/                    (Migration files)
├── requirements.txt                 (Dependencies)
├── Dockerfile                       (Container image)
├── run.py                           (Entry point)
└── alembic.ini                      (Migration settings)
```

### Main.py Flow
```python
Base.metadata.create_all(bind=engine)  # Create tables
app = FastAPI(title="StudentOS API", version="1.0.0")
# CORS middleware
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins_list, ...)
# Register routers with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(subjects.router, prefix="/api/v1")
# ... other routers
```

---

## 4. DATABASE SCHEMA

### Tables & Relationships

#### `users` (Core Identity)
```sql
id (PK, Integer)
student_id (Unique, String)
name (String)
email (Unique, String)
hashed_password (String)
created_at (DateTime)

-- Relationships
1:N → subjects
1:N → assignments
1:N → attendance
1:N → notes
1:N → chat_sessions
```

#### `subjects` (Course Management)
```sql
id (PK, Integer)
user_id (FK → users.id)
name (String)
code (String)
color (String) -- Hex color for UI
created_at (DateTime)

-- Relationships
1:N → timetable_entries
1:N → assignments
1:N → attendance
1:N → notes
```

#### `timetable` (Schedule Management)
```sql
id (PK, Integer)
subject_id (FK → subjects.id)
day_of_week (Integer) -- 0=Mon, 6=Sun
start_time (String) -- "HH:MM" format
end_time (String) -- "HH:MM" format
location (String, nullable)
created_at (DateTime)

-- Relationships
N:1 → subjects
```

#### `assignments` (Task Tracking)
```sql
id (PK, Integer)
user_id (FK → users.id)
subject_id (FK → subjects.id)
title (String)
description (Text, nullable)
due_date (DateTime)
status (Enum: todo | in_progress | done)
priority (Enum: low | medium | high)
created_at (DateTime)
updated_at (DateTime)

-- Relationships
N:1 → users
N:1 → subjects
```

#### `attendance` (Attendance Tracking)
```sql
id (PK, Integer)
user_id (FK → users.id)
subject_id (FK → subjects.id)
date (DateTime)
status (Enum: present | absent | excused)
created_at (DateTime)

-- Relationships
N:1 → users
N:1 → subjects
```

#### `notes` (Study Notes)
```sql
id (PK, Integer)
user_id (FK → users.id)
subject_id (FK → subjects.id)
title (String)
content (Text)
created_at (DateTime)
updated_at (DateTime)

-- Relationships
1:N → note_chunks
N:1 → users
N:1 → subjects
```

#### `note_chunks` (RAG Pipeline)
```sql
id (PK, Integer)
note_id (FK → notes.id)
chunk_index (Integer)
content (Text)
embedding (Float, nullable) -- Will be pgvector format
```

#### `chat_sessions` (AI Assistant Context)
```sql
id (PK, Integer)
user_id (FK → users.id)
created_at (DateTime)

-- Relationships
1:N → chat_messages
```

#### `chat_messages` (Conversation History)
```sql
id (PK, Integer)
session_id (FK → chat_sessions.id)
role (Enum: user | assistant)
content (Text)
created_at (DateTime)
```

---

## 5. API ENDPOINTS

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Pattern
```
Header: Authorization: Bearer <access_token>
Refresh: POST /auth/refresh with { refresh_token }
On 401: Client auto-retries after token refresh
```

### Auth Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /auth/register | ❌ | `{student_id, name, email, password}` | `{access_token, refresh_token, user}` |
| POST | /auth/login | ❌ | `{email, password}` | `{access_token, refresh_token, user}` |
| POST | /auth/refresh | ❌ | `{refresh_token}` | `{access_token}` |
| GET | /auth/me | ✅ | — | `{id, student_id, name, email}` |

### Subject Management
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | /subjects | ✅ | — | `[{id, name, code, color}]` |
| POST | /subjects | ✅ | `{name, code, color}` | `{id, name, code, color}` |
| PUT | /subjects/{id} | ✅ | `{name?, code?, color?}` | `{id, name, code, color}` |
| DELETE | /subjects/{id} | ✅ | — | `204 No Content` |

### Timetable (Schedule) Management
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | /timetable | ✅ | — | `[{id, subject_id, day_of_week, start_time, end_time, location}]` |
| POST | /timetable | ✅ | `{subject_id, day_of_week, start_time, end_time, location?}` | entry object |
| PUT | /timetable/{id} | ✅ | partial fields | entry object |
| DELETE | /timetable/{id} | ✅ | — | `204 No Content` |

**Conflict Detection**: Returns `409 Conflict` if time overlaps for same subject

### Assignments
| Method | Path | Auth | Query | Body | Response |
|--------|------|------|-------|------|----------|
| GET | /assignments | ✅ | `?status=&subject_id=` | — | `[{id, subject_id, title, description, due_date, status, priority}]` |
| POST | /assignments | ✅ | — | `{subject_id, title, description?, due_date, priority}` | assignment object |
| PUT | /assignments/{id} | ✅ | — | partial fields | assignment object |
| DELETE | /assignments/{id} | ✅ | — | — | `204 No Content` |

**Enums**: 
- status: `todo | in_progress | done` (default: `todo`)
- priority: `low | medium | high` (default: `medium`)

### Attendance
| Method | Path | Auth | Query | Body | Response |
|--------|------|------|-------|------|----------|
| GET | /attendance | ✅ | `?subject_id=` | — | `[{id, subject_id, date, status}]` |
| POST | /attendance | ✅ | — | `{subject_id, date, status}` | attendance record |
| GET | /attendance/summary | ✅ | — | — | `[{subject_id, percentage, total_classes, attended}]` |

**Enum**: status: `present | absent | excused`

### Notes (Study Notes)
| Method | Path | Auth | Query | Body | Response |
|--------|------|------|-------|------|----------|
| GET | /notes | ✅ | `?subject_id=` | — | `[{id, subject_id, title, updated_at}]` (list only) |
| GET | /notes/{id} | ✅ | — | — | `{id, subject_id, title, content, created_at, updated_at}` |
| POST | /notes | ✅ | — | `{subject_id, title, content}` | full note object |
| PUT | /notes/{id} | ✅ | — | `{title?, content?}` | full note object (re-embeds) |
| DELETE | /notes/{id} | ✅ | — | — | `204 No Content` |

**Note**: PUT re-triggers embedding pipeline for RAG

### AI Assistant
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /assistant/chat | ✅ | `{session_id?, message}` | `{session_id, answer, citations: [{note_id, note_title}]}` |
| POST | /assistant/summarize | ✅ | `{subject_id}` | `{summary}` |
| POST | /assistant/quiz | ✅ | `{subject_id, topic?}` | `{questions: [{question, options?, answer}]}` |

### Analytics
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | /analytics/attendance-risk | ✅ | — | `[{subject_id, risk_score, reason}]` |
| GET | /analytics/study-patterns | ✅ | — | `{notes_per_subject: [...], assignment_completion_rate: [...], note_frequency_over_time: [...]}` |

---

## 6. AUTHENTICATION & AUTHORIZATION

### JWT Token Strategy
```
Access Token:
  - Payload: {sub: user_id, email: user_email, iat, exp}
  - Lifetime: Short (typically 15-60 min)
  - Usage: Every API request in Authorization header
  
Refresh Token:
  - Payload: {sub: user_id, email: user_email, iat, exp}
  - Lifetime: Long (typically 7-30 days)
  - Usage: Token renewal endpoint
```

### Token Flow
```
1. POST /auth/register or /auth/login
2. Backend returns {access_token, refresh_token, user}
3. Frontend stores tokens in localStorage
4. Frontend includes access_token in every request
5. On 401 response:
   a. Frontend calls POST /auth/refresh with refresh_token
   b. Backend validates and returns new access_token
   c. Frontend retries original request
```

### Current User Dependency
```python
# app/dependencies.py
get_current_user() → Depends(get_current_user)
# Validates JWT and injects {user_id, email, ...} into request context
```

### Password Security
- **Hashing**: bcrypt (passlib[bcrypt])
- **Verification**: passlib.verify_password()
- **Storage**: Never store plaintext passwords

---

## 7. KEY SERVICES

### AI Client (`app/services/ai_client.py`)
**Abstract Provider Pattern**:
```python
class AIProvider(ABC):
    async def chat(message, context?) → str
    async def embed(text) → list[float]

class GeminiProvider(AIProvider):
    # Uses google-generativeai
    # Model: gemini-2.0-flash
    
class XAIProvider(AIProvider):
    # Uses OpenAI-compatible API
    # Model: grok-beta
    # Note: Embedding not available yet
```

**Provider Selection**:
```python
get_ai_provider():
    if settings.gemini_api_key:
        return GeminiProvider(...)
    elif settings.xai_api_key:
        return XAIProvider(...)
    else:
        raise ValueError("No AI API configured")
```

### RAG Pipeline (`app/services/rag_pipeline.py`)
**Status**: In progress  
**Intended Flow**:
1. Note submission → Chunk text
2. Generate embeddings for chunks
3. Store in pgvector
4. On chat query → Semantic search chunks
5. Pass retrieved chunks as context to LLM

---

## 8. DEPENDENCIES & VERSIONS

### Backend
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.35
alembic==1.13.3
psycopg[binary]==3.2.3
pydantic==2.9.2
pydantic-settings==2.6.0
python-jose[cryptography]==3.3.0
bcrypt==4.2.1
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
google-generativeai==0.8.3
openai==1.54.0
```

### Frontend (Key Packages)
```
@tanstack/react-start==1.168.26
@tanstack/react-router==1.170.16
@tanstack/react-query==5.101.1
react==19.x (via TanStack)
typescript==5.x
tailwindcss==4.2.1
@radix-ui/* (60+ components)
shadcn/ui components
```

---

## 9. ENVIRONMENT CONFIGURATION

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key-min-32-chars

# Optional (AI Features)
GEMINI_API_KEY=...
XAI_API_KEY=...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# Default from docker-compose
# POSTGRES_USER=studentos
# POSTGRES_PASSWORD=sharan@12300
# POSTGRES_DB=studentos
```

### Frontend (Vite Env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 10. DEPLOYMENT & INFRASTRUCTURE

### Docker Compose Setup
**File**: [docker-compose.yml](docker-compose.yml)

```yaml
Services:
1. postgres:15-alpine
   - Container: studentos-postgres
   - User: studentos
   - Pass: sharan@12300
   - DB: studentos
   - Port: 5432
   - Health Check: pg_isready

2. backend (built from ./backend/Dockerfile)
   - Container: studentos-backend
   - Port: 8000
   - Command: uvicorn app.main:app --reload
   - Depends on: postgres (healthy)
   - Mounts: ./backend:/app (volume)

Volumes:
- postgres_data: Persistent DB storage
```

### Local Development Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev

# Or use Docker Compose
docker-compose up --build
```

### Available Tasks
```bash
# Defined in .vscode/tasks.json
npm run dev     # Start Backend (cd backend && uvicorn ...)
npm run dev     # Start Frontend (cd frontend && npm run dev)
Start All Servers  # Composite task
```

---

## 11. KNOWN LIMITATIONS & TRADE-OFFS

### 1. SSR Disabled for Auth Routes
**Issue**: Authenticated routes use `ssr: false` in TanStack Router  
**Reason**: Avoids building full cookie-session backend infrastructure  
**Trade-off**: Slightly slower first paint on authenticated pages (JSON revalidation)  
**Impact**: Acceptable for MVP; can be upgraded to SSR + sessions later

### 2. Synthetic Training Data
**Issue**: Attendance risk model trained on synthetic data  
**Reason**: No real user data available in v1  
**Impact**: Analytics accuracy may be low; requires real data replacement in production

### 3. AI Features Optional
**Issue**: Requires GEMINI_API_KEY or XAI_API_KEY to be set  
**Behavior**: App works without them, but AI features disabled  
**Workaround**: Set at least one API key in .env

### 4. RAG Pipeline Incomplete
**Issue**: Note embedding and semantic search not fully implemented  
**Status**: In progress  
**Impact**: Chat context relies on note content alone (no vector search)

### 5. No xAI Embedding Support
**Issue**: xAI doesn't have public embedding API  
**Workaround**: Use Gemini for embeddings or external service

---

## 12. CURRENT FEATURES & STATUS

### ✅ Implemented
- User registration & login (JWT)
- Subject management (CRUD)
- Timetable with conflict detection
- Assignment tracking (todo/in_progress/done)
- Attendance recording with summary
- Notes with markdown support
- AI Chat (requires API key)
- AI Summarize (subject level)
- AI Quiz generation (subject/topic level)
- Analytics (attendance risk, study patterns)
- Token refresh mechanism
- CORS configuration
- Docker containerization

### 🚧 In Progress
- RAG pipeline with pgvector embeddings
- Vector-based semantic search for chat context
- Advanced ML analytics

### ⏳ Planned
- Real-time collaboration on notes
- Exam schedule optimization
- Peer study groups
- Mobile app (React Native)
- Offline mode
- Export to PDF

---

## 13. CRITICAL CODE PATTERNS

### Database Query Pattern (get_current_user)
```python
@router.get("/subjects")
def get_subjects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    return subjects
```
**Pattern**: All queries filtered by current_user to enforce data isolation

### Token Refresh Pattern (Frontend)
```typescript
if (response.status === 401) {
    const refreshed = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({refresh_token: this.refreshToken})
    });
    this.setTokens(refreshed.access_token, this.refreshToken);
    return this.request(endpoint, options);  // Retry
}
```

### Enum Usage
```python
status = Column(Enum("todo", "in_progress", "done", name="assignment_status"))
```
**Backend**: Maps to database CHECK constraints  
**Frontend**: Validated via API schema

---

## 14. ERROR HANDLING

### Standardized Error Response
```json
{
    "detail": "human readable message"
}
```
**HTTP Status Codes**:
- `200`: Success
- `201`: Created (not used; returning 200)
- `204`: No Content (deletion)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/expired token)
- `404`: Not Found
- `409`: Conflict (timetable overlap, duplicate email)
- `500`: Server Error

### Common Errors
| Scenario | Status | Detail |
|----------|--------|--------|
| Invalid email/password | 401 | "Invalid email or password" |
| Duplicate user | 400 | "Email or student ID already registered" |
| Timetable overlap | 409 | "Time conflict with <entry title>" |
| Not found | 404 | "{Resource} not found" |
| Expired token | 401 | "Invalid access token" |

---

## 15. POTENTIAL ISSUES & IMPROVEMENTS

### Issues to Address
1. **No request logging**: Add structured logging (e.g., python-json-logger)
2. **Missing pagination**: All list endpoints return full result sets
3. **No rate limiting**: Could be abused
4. **No audit trail**: No record of who changed what/when
5. **Frontend localhost only**: SSR disabled means non-friendly for crawlers
6. **pgvector not configured**: DB migrations don't create pgvector extension
7. **No backup strategy**: Docker volume not on backup schedule
8. **Hard-coded JWT expiry**: No configuration for token lifetimes

### Recommended Improvements
1. Add request logging middleware
2. Implement pagination with cursor/offset
3. Add rate limiting (SlowAPI)
4. Enable pgvector extension in migration
5. Add comprehensive test suite (pytest)
6. Implement audit logging for assignments/attendance
7. Cache frequently accessed data (Redis)
8. Add file upload support for attachments
9. Implement full-text search on notes
10. Add WebSocket support for real-time updates

---

## 16. SECURITY CONSIDERATIONS

### Implemented
- ✅ JWT tokens (secure if not exposed)
- ✅ Password hashing (bcrypt)
- ✅ CORS policy enforcement
- ✅ User data isolation (filtered by user_id)

### Missing
- ❌ HTTPS enforcement (dev only has http)
- ❌ SQL injection protection (relying on ORM/Pydantic)
- ❌ Rate limiting
- ❌ Input validation on all endpoints (Pydantic helps)
- ❌ CSRF protection (stateless JWT not vulnerable)
- ❌ Secrets management (env vars in plaintext .env)
- ❌ API key rotation
- ❌ Audit logging

### Recommendations
1. Use `.env.example` for safe sharing
2. Implement HTTPS in production
3. Use AWS Secrets Manager / Vault for keys
4. Add API key rate limiting
5. Implement request signing
6. Add request ID tracing for debugging
7. Monitor and alert on authentication failures

---

## 17. PERFORMANCE CONSIDERATIONS

### Current Bottlenecks
1. **N+1 queries**: Subject page might fetch user for each item
2. **No indexing**: Only primary keys and foreign keys indexed
3. **Full table scans**: Attendance summary computes all records
4. **Embedding generation**: Synchronous (should be async/background)
5. **No caching**: Every request hits database

### Optimization Opportunities
1. Add database indexes on:
   - `subjects.user_id`
   - `assignments.user_id, assignments.due_date`
   - `attendance.user_id, attendance.date`
   - `notes.user_id, notes.subject_id`
2. Implement Redis caching for:
   - User subjects (TTL: 1 hour)
   - Attendance summary (TTL: 1 day)
   - User profile (TTL: 1 hour)
3. Use SQLAlchemy's `selectinload()` for eager loading
4. Move embedding generation to background task queue (Celery)
5. Add query result pagination
6. Use database views for summary data

---

## 18. TESTING STRATEGY

### Test Files in Repo
- `test_register.py`: User registration tests
- `debug_register.py`: Debug/manual tests
- Backend: No pytest suite yet
- Frontend: No test suite yet

### Recommended Test Coverage
```python
# Backend (pytest + pytest-asyncio)
tests/
├── unit/
│   ├── test_auth.py
│   ├── test_schemas.py
│   └── test_utils.py
├── integration/
│   ├── test_subjects.py
│   ├── test_assignments.py
│   ├── test_ai_integration.py
│   └── test_database.py
└── fixtures.py  # Test data

# Frontend (vitest + React Testing Library)
src/__tests__/
├── components/
├── hooks/
├── utils/
└── integration/
```

---

## 19. DEPLOYMENT CHECKLIST

- [ ] Set production JWT_SECRET (min 32 chars)
- [ ] Configure DATABASE_URL for production DB
- [ ] Set ALLOWED_ORIGINS to production domain
- [ ] Set GEMINI_API_KEY or XAI_API_KEY
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable request logging
- [ ] Configure monitoring/alerting
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific .env
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Test token refresh flow
- [ ] Test error handling

---

## 20. QUICK START COMMANDS

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
alembic upgrade head
python -m uvicorn app.main:app --reload

# Frontend setup
cd frontend
npm install
npm run dev

# Docker setup
docker-compose up --build

# Health check
curl http://localhost:8000/health
curl http://localhost:5173 (or vite dev port)
```

---

## SUMMARY

**StudentOS** is a well-structured MVP for academic management with:
- **Clean architecture**: Layered backend (routers → models → DB)
- **Modern frontend**: React 19 + TanStack ecosystem
- **Extensible AI**: Pluggable provider pattern for LLMs
- **Solid foundation**: Ready for scaling with improvements

**Next Phase**: Complete RAG pipeline, add pagination, implement proper testing, and transition SSR routes to full server rendering.

