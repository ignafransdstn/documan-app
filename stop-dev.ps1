# DocuMan - Stop Development Services (Windows PowerShell)
# Usage: .\stop-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DocuMan - Stopping Development Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to kill process by port
function Stop-ProcessByPort {
    param (
        [int]$Port,
        [string]$ServiceName
    )
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $pid = $connection.OwningProcess
        Write-Host "Stopping $ServiceName (Port $Port, PID $pid)..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $pid -Force
            Write-Host "  [OK] $ServiceName stopped" -ForegroundColor Green
        } catch {
            Write-Host "  [X] Failed to stop $ServiceName" -ForegroundColor Red
        }
    } else {
        Write-Host "  [.] $ServiceName (Port $Port) not running" -ForegroundColor Gray
    }
}

# Stop Backend (Port 5001)
Stop-ProcessByPort -Port 5001 -ServiceName "Backend"

# Stop Frontend (Port 5173)
Stop-ProcessByPort -Port 5173 -ServiceName "Frontend"

# Also kill any Node processes related to the project
Write-Host ""
Write-Host "Cleaning up Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*documan-app*"
}

if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Stopping Node.js process (PID $($_.Id))..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  [OK] Cleaned up" -ForegroundColor Green
} else {
    Write-Host "  [.] No related Node processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services stopped" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
