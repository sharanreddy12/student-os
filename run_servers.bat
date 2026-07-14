@echo off
echo Starting Backend Server...
start "Backend" cmd /c "cd /d c:\Users\durgamsharan\OneDrive\Documents\ss40intern\Student1\studentos-os-interface\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo Starting Frontend Server...
start "Frontend" cmd /c "cd /d c:\Users\durgamsharan\OneDrive\Documents\ss40intern\Student1\studentos-os-interface\frontend && npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
pause