# StudentOS

StudentOS is a modern, AI-powered academic management system designed to streamline the educational experience for both students and teachers. 

## Features

- **Role-Based Dashboards**: Tailored interfaces for Students, Teachers, Admins, and Super Admins.
- **Academic Tracking**: Comprehensive management of Timetables, Attendance, Assignments, and Term Marks.
- **AI Academic Assistant**: An intelligent chatbot powered by **Llama 3** (via Groq) that can answer queries grounded in the user's academic context (attendance, marks, assignments) and uploaded study notes using Retrieval-Augmented Generation (RAG).
- **Study Notes Management**: Upload and index markdown notes for the AI to retrieve and assist with studies.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) / [TanStack Start](https://tanstack.com/router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) (Headless accessible components)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [SQLite](https://www.sqlite.org/) with [SQLAlchemy](https://www.sqlalchemy.org/) ORM (and Alembic for migrations)
- **AI/LLM**: [Groq API](https://groq.com/) for lightning-fast Llama-3 inference.
- **RAG Pipeline**: Custom built embedding fallback search and text chunking system.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### 1. Backend Setup

Navigate to the backend directory and set up your Python environment:

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory using `.env.example` as a template and provide your Groq API key:
```env
VITE_API_URL=http://localhost:8000/api/v1
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Apply database migrations:
```bash
alembic upgrade head
```

Run the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

In a new terminal window, navigate to the frontend directory:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Architecture & API Contract
- The frontend and backend communicate via a strictly defined REST API. 
- The backend handles authentication (JWT) and passes context-aware datasets directly to the AI Assistant module, ensuring secure multi-tenant data access.
- See `api-contract.md` and `architecture_diagram.md` for deeper technical insights.
