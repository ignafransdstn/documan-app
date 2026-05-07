# DocuMan - Start Development Services (Windows PowerShell)
# Usage: .\start-dev.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DocuMan - Starting Development Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "  ✓ PostgreSQL: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ PostgreSQL command not found (may still work if service is running)" -ForegroundColor Yellow
}

Write-Host ""

# Check .env file
Write-Host "[2/5] Checking configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  ✓ backend/.env exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ backend/.env NOT FOUND!" -ForegroundColor Red
    Write-Host "  Creating default .env file..." -ForegroundColor Yellow
    
    $envContent = @"
PORT=5001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=doc_management_dev
JWT_SECRET=my-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
"@
    
    Set-Content -Path "backend\.env" -Value $envContent
    Write-Host "  ✓ Created backend/.env with default values" -ForegroundColor Green
    Write-Host "  ⚠ IMPORTANT: Edit backend/.env with your actual PostgreSQL credentials!" -ForegroundColor Yellow
}

Write-Host ""

# Check dependencies
Write-Host "[3/5] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "  ✗ Backend dependencies not installed" -ForegroundColor Red
    Write-Host "  Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "  ✗ Frontend dependencies not installed" -ForegroundColor Red
    Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""

# Check if ports are already in use
Write-Host "[4/5] Checking ports..." -ForegroundColor Yellow
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port5001) {
    Write-Host "  ⚠ Port 5001 (Backend) is already in use" -ForegroundColor Yellow
    $pid = $port5001.OwningProcess
    Write-Host "    PID: $pid" -ForegroundColor Gray
    $kill = Read-Host "  Kill existing process? (y/N)"
    if ($kill -eq 'y' -or $kill -eq 'Y') {
        Stop-Process -Id $pid -Force
        Write-Host "  ✓ Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "  ✓ Port 5001 available" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "  ⚠ Port 5173 (Frontend) is already in use" -ForegroundColor Yellow
    $pid = $port5173.OwningProcess
    Write-Host "    PID: $pid" -ForegroundColor Gray
    $kill = Read-Host "  Kill existing process? (y/N)"
    if ($kill -eq 'y' -or $kill -eq 'Y') {
        Stop-Process -Id $pid -Force
        Write-Host "  ✓ Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "  ✓ Port 5173 available" -ForegroundColor Green
}

Write-Host ""

# Start services
Write-Host "[5/5] Starting services..." -ForegroundColor Yellow
Write-Host "  Starting Backend + Frontend with concurrently..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Services Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Backend API:    http://localhost:5001" -ForegroundColor White
Write-Host "API Docs:       http://localhost:5001/api-docs" -ForegroundColor White
Write-Host "Frontend UI:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop services" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Run with concurrently
npm run dev
