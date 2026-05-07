# DocuMan - Check Service Status (Windows PowerShell)
# Usage: .\status-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DocuMan - Service Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check port and get process info
function Get-ServiceStatus {
    param (
        [int]$Port,
        [string]$ServiceName,
        [string]$URL
    )
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        Write-Host "[OK] $ServiceName" -ForegroundColor Green
        Write-Host "  Port:    $Port" -ForegroundColor Gray
        Write-Host "  PID:     $processId" -ForegroundColor Gray
        Write-Host "  Process: $($process.ProcessName)" -ForegroundColor Gray
        Write-Host "  URL:     $URL" -ForegroundColor Cyan
    } else {
        Write-Host "[X] $ServiceName" -ForegroundColor Red
        Write-Host "  Port:    $Port (NOT LISTENING)" -ForegroundColor Gray
        Write-Host "  Status:  Service not running" -ForegroundColor Red
    }
    Write-Host ""
}

# Check Backend
Get-ServiceStatus -Port 5001 -ServiceName "Backend API" -URL "http://localhost:5001"

# Check Frontend (port may be 5173, 5174, or 5175 depending on availability)
Get-ServiceStatus -Port 5175 -ServiceName "Frontend UI" -URL "http://localhost:5175"

# Check Database Connection
Write-Host "Database Connection:" -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  [OK] Configuration file exists" -ForegroundColor Green
    
    # Try to read database name from .env
    $envContent = Get-Content "backend\.env" -Raw
    $dbName = 'doc_management_dev'
    if ($envContent -match 'DB_NAME=(.+)') {
        $dbName = $matches[1].Trim()
    }
    Write-Host "  Database: $dbName" -ForegroundColor Gray
    
    # Try to connect to PostgreSQL
    $psqlPath = Get-Command "C:\Program Files\PostgreSQL\18\bin\psql.exe" -ErrorAction SilentlyContinue
    if ($psqlPath) {
        $env:PGPASSWORD = 'admin'
        $result = & "$($psqlPath.Source)" -U postgres -h localhost -d $dbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            Write-Host "  [OK] PostgreSQL connected" -ForegroundColor Green
            Write-Host "  Tables:   $($result.Trim())" -ForegroundColor Gray
        } else {
            Write-Host "  [!] Could not connect to database" -ForegroundColor Yellow
        }
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    } else {
        Write-Host "  [!] psql command not found" -ForegroundColor Yellow
        Write-Host "    (Expected at: C:\Program Files\PostgreSQL\18\bin\psql.exe)" -ForegroundColor Gray
    }
} else {
    Write-Host "  [X] backend/.env file missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "  Start:  .\start-simple.ps1" -ForegroundColor White
Write-Host "  Stop:   .\stop-dev.ps1" -ForegroundColor White
Write-Host "  Status: .\status-dev.ps1" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
