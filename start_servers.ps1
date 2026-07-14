# Start Backend Server
Write-Host "Starting Backend Server (port 8000)..." -ForegroundColor Green
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
    Set-Location "c:\Users\durgamsharan\OneDrive\Documents\ss40intern\Student1\studentos-os-interface\backend"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

# Start Frontend Server
Write-Host "Starting Frontend Server (port 5173)..." -ForegroundColor Green
$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
    Set-Location "c:\Users\durgamsharan\OneDrive\Documents\ss40intern\Student1\studentos-os-interface\frontend"
    npm run dev
}

Start-Sleep -Seconds 5

Write-Host "`n=== Checking Server Status ===" -ForegroundColor Yellow
Write-Host "Backend Job State: $($backendJob.State)" -ForegroundColor Cyan
Write-Host "Frontend Job State: $($frontendJob.State)" -ForegroundColor Cyan

Write-Host "`n=== Backend Output ===" -ForegroundColor Yellow
Receive-Job -Job $backendJob -Keep 2>&1

Write-Host "`n=== Frontend Output ===" -ForegroundColor Yellow
Receive-Job -Job $frontendJob -Keep 2>&1

Write-Host "`n=== Servers Started! ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green