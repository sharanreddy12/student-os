# StudentOS — AI Operating System for Students

A full-stack AI-powered academic management system built with TanStack Start, FastAPI, and PostgreSQL.

## Architecture

### Frontend

- **Framework**: TanStack Start (React 19 + TypeScript)
- **Styling**: TailwindCSS 4 with custom glass/neon design system
- **Components**: Radix UI + shadcn/ui
- **Animations**: Motion (Framer Motion)
- **State Management**: TanStack Query
- **Routing**: TanStack Router (file-based)

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: SQLAlchemy 2.0 + Alembic migrations
- **Authentication**: JWT (access + refresh tokens)
- **AI Integration**: Swappable provider interface (Gemini or xAI Grok)

## Features

- ✅ User authentication (register, login, token refresh)
- ✅ Subject management
- ✅ Timetable with conflict detection
- ✅ Assignment tracking
- ✅ Attendance recording
- ✅ Notes with markdown support
- ✅ AI Assistant (chat, summarize, quiz)
- ✅ Analytics (attendance risk, study patterns)
- 🚧 RAG pipeline (in progress)
- 🚧 Advanced ML analytics (planned)

## Known Limitations

1. **SSR Disabled for Auth Routes**: Authenticated routes use `ssr: false` to avoid building a full cookie-session backend. This is a deliberate trade-off for simplicity, at the cost of slightly slower first paint on authenticated pages.

2. **Synthetic Training Data**: The attendance risk model is trained on synthetic data. This is a known v1 limitation and should be replaced with real user data in production.

3. **AI Features Require API Keys**: AI features (chat, summarize, quiz) require either a Gemini API key or xAI API key. These are optional - the app works without them, but AI features will be disabled.

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (or use Docker)
- Docker (optional, for containerized setup)

### Backend Setup

1. **Navigate to backend directory**:

```bash
cd backend
```

2. **Create virtual environment**:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:

```bash
pip install -r requirements.txt
```

4. **Configure environment variables**:

```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `http://localhost:3000,http://localhost:5173`)

Optional (for AI features):

- `GEMINI_API_KEY` - Google Gemini API key
- `XAI_API_KEY` - xAI Grok API key

5. **Run database migrations**:

```bash
alembic upgrade head
```

6. **Start the backend server**:

```bash
python run.py
```

The backend will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies**:

```bash
bun install  # or npm install
```

2. **Configure environment variables**:

```bash
cp .env.example .env
# Edit .env with your backend URL
```

3. **Start the development server**:

```bash
bun run dev  # or npm run dev
```

The frontend will be available at `http://localhost:3000`

### Docker Setup (Recommended)

1. **Start PostgreSQL and backend**:

```bash
docker-compose up
```

This will start:

- PostgreSQL on port 5432
- Backend API on port 8000

2. **Run migrations** (first time only):

```bash
docker-compose exec backend alembic upgrade head
```

3. **Start the frontend** (in a separate terminal):

```bash
bun run dev
```

## API Contract

All API endpoints are documented in `api-contract.md`. Both frontend and backend must conform to this contract exactly.

Base URL: `http://localhost:8000/api/v1`

Authentication: Bearer JWT in `Authorization: Bearer <access_token>` header

## Development

### Adding New Features

1. **Backend**: Add endpoints to `backend/app/routers/`, update models in `backend/app/models.py`
2. **Frontend**: Add routes to `src/routes/`, use the API client in `src/api/client.ts`
3. **API Contract**: Update `api-contract.md` first, then implement both sides

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend linting
bun run lint
```

## Project Structure

```
studentos-os-interface/
├── api-contract.md          # Shared API specification
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic (AI, etc.)
│   │   ├── auth.py         # JWT utilities
│   │   ├── dependencies.py # Auth dependencies
│   │   ├── database.py     # Database connection
│   │   └── config.py       # Configuration
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── src/                     # TanStack Start frontend
│   ├── routes/             # File-based routing
│   ├── components/         # React components
│   │   ├── landing/        # Landing page components
│   │   └── ui/             # shadcn/ui components
│   ├── api/                # API client
│   ├── lib/                # Utilities
│   ├── hooks/              # Custom hooks
│   └── styles.css          # Global styles
├── docker-compose.yml       # Docker orchestration
└── package.json            # Frontend dependencies
```

## License

MIT
