# DocuMan - PostgreSQL Password Test
# Usage: .\test-postgres-connection.ps1

param(
    [string]$Password
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Connection Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Password) {
    Write-Host "Testing common default passwords..." -ForegroundColor Yellow
    Write-Host ""
    
    $passwords = @("postgres", "admin", "password", "root", "12345", "")
    
    foreach ($pw in $passwords) {
        Write-Host "Testing password: " -NoNewline
        if ($pw -eq "") {
            Write-Host "[empty]" -ForegroundColor Gray
        } else {
            Write-Host "[$pw]" -ForegroundColor Gray
        }
        
        $env:PGPASSWORD = $pw
        $test = & psql -U postgres -h localhost -d postgres -c "SELECT 1;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [SUCCESS] Password found: $pw" -ForegroundColor Green
            Write-Host ""
            Write-Host "Update your backend/.env file with:" -ForegroundColor Yellow
            Write-Host "  DB_PASSWORD=$pw" -ForegroundColor White
            Write-Host ""
            Write-Host "Then run: .\setup-database.ps1 -Password '$pw'" -ForegroundColor Cyan
            $env:PGPASSWORD = $null
            exit 0
        } else {
            Write-Host "  [FAILED]" -ForegroundColor Red
        }
    }
    
    $env:PGPASSWORD = $null
    Write-Host ""
    Write-Host "[X] None of the common passwords worked" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Try with custom password: .\test-postgres-connection.ps1 -Password 'your_password'" -ForegroundColor White
    Write-Host "  2. Reset PostgreSQL password in pgAdmin" -ForegroundColor White
    Write-Host "  3. Use Windows Authentication (trust) in pg_hba.conf" -ForegroundColor White
    Write-Host "  4. Use Docker PostgreSQL instead" -ForegroundColor White
    
} else {
    Write-Host "Testing password: [$Password]" -ForegroundColor Gray
    $env:PGPASSWORD = $Password
    $test = & psql -U postgres -h localhost -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "PostgreSQL Version:" -ForegroundColor Cyan
        Write-Host $test | Select-String "PostgreSQL"
        Write-Host ""
        Write-Host "Next step: Run database setup" -ForegroundColor Yellow
        Write-Host "  .\setup-database.ps1 -Password '$Password'" -ForegroundColor White
    } else {
        Write-Host "[X] Connection failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error:" -ForegroundColor Yellow
        Write-Host $test -ForegroundColor Gray
    }
    
    $env:PGPASSWORD = $null
}

Write-Host ""
