
# Repository operating instructions for StudentOS

This repository is a full-stack student management system with a TanStack Start frontend and a FastAPI backend. Any requested change must be implemented across the relevant layers and kept consistent with the existing architecture.

## Core stack
- Frontend: TanStack Start, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Router
- Backend: FastAPI, SQLAlchemy 2, Alembic, Pydantic, JWT auth, PostgreSQL
- Shared contract: [api-contract.md](api-contract.md)

## Project map
- Frontend app lives in [frontend](frontend)
- Backend app lives in [backend/app](backend/app)
- Shared API contract lives in [api-contract.md](api-contract.md)
- Database migrations live in [backend/alembic/versions](backend/alembic/versions)

## Must-follow rules
1. Treat [api-contract.md](api-contract.md) as the source of truth for API shape.
2. If a change affects an endpoint, update the contract first, then implement backend and frontend changes together.
3. Keep frontend and backend behavior aligned; do not introduce a new API response shape without updating both sides.
4. Preserve the existing auth flow: JWT access/refresh tokens stored in frontend storage and sent via the API client.
5. Prefer existing patterns and component libraries instead of introducing new frameworks or ad-hoc implementations.
6. Keep AI features optional; the app should still function if API keys are absent.
7. Preserve the repository’s working state and avoid destructive git history operations.

## Frontend conventions
- Use the existing TanStack Router file-based routes in [frontend/src/routes](frontend/src/routes)
- Reuse UI primitives from [frontend/src/components/ui](frontend/src/components/ui) when possible
- Keep API calls centralized in [frontend/src/api/client.ts](frontend/src/api/client.ts)
- Use the existing auth and user context patterns in [frontend/src/contexts](frontend/src/contexts)
- Follow the current TypeScript and React patterns already used in the project

## Backend conventions
- Add or modify routers in [backend/app/routers](backend/app/routers)
- Keep models and schemas consistent in [backend/app/models.py](backend/app/models.py) and [backend/app/schemas.py](backend/app/schemas.py)
- Use Alembic migrations for schema changes rather than editing the database manually
- Keep the FastAPI app entry behavior consistent with [backend/app/main.py](backend/app/main.py)
- Preserve current auth, role, and status handling unless the request explicitly changes it

## Change workflow
When the user asks for any change:
1. Identify the affected frontend/backend/storage/API contract layers
2. Update the shared contract if endpoints or payloads change
3. Implement the change in the appropriate backend files
4. Update the frontend to match the new behavior
5. Verify the change with the relevant local checks or by inspecting the affected flow

## Important implementation notes
- The app currently expects a PostgreSQL-backed backend and local dev URLs such as http://localhost:8000/api/v1
- The frontend uses environment-based API configuration via VITE_API_URL
- CORS and origin configuration are controlled through backend settings, not by hardcoding one-off origins
- Keep error responses consistent with the existing API contract format

If a request is ambiguous, ask a focused clarification question before changing behavior.
