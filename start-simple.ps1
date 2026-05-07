# DocuMan - Simple Start Script (No Crash)
# Usage: .\start-simple.ps1
# This script starts services in a safer way to avoid VS Code crashes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DocuMan - Starting Services (Simple)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies installed
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# Check .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "[X] backend/.env not found!" -ForegroundColor Red
    Write-Host "Please create it with your database credentials." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Dependencies ready" -ForegroundColor Green
Write-Host ""

# Instructions for manual start
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Manual Start Instructions (Recommended)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To avoid crashes, start services in separate terminals:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Press [A] to auto-start both, [B] for backend only, [F] for frontend only, or [Q] to quit"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "Starting both services..." -ForegroundColor Green
        Write-Host "Note: Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        
        # Use separate PowerShell windows to avoid blocking
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
        Start-Sleep -Seconds 2
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"
        
        Write-Host "[OK] Services started in separate windows" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs:" -ForegroundColor Cyan
        Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
        Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
        Write-Host "  API Docs: http://localhost:5001/api-docs" -ForegroundColor White
    }
    "B" {
        Write-Host ""
        Write-Host "Starting backend only..." -ForegroundColor Green
        Push-Location backend
        npm run dev
        Pop-Location
    }
    "F" {
        Write-Host ""
        Write-Host "Starting frontend only..." -ForegroundColor Green
        Push-Location frontend
        npm run dev
        Pop-Location
    }
    default {
        Write-Host "Cancelled." -ForegroundColor Gray
    }
}
