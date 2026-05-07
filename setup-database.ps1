# DocuMan - Database Setup Script (Safe Mode)
# Usage: .\setup-database.ps1

param(
    [string]$Password = "postgres"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DocuMan - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dbName = "doc_management_dev"
$dbUser = "postgres"
$dbHost = "localhost"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor Gray
Write-Host "  User:     $dbUser" -ForegroundColor Gray
Write-Host "  Host:     $dbHost" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if psql command exists
Write-Host "[1/4] Checking PostgreSQL installation..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "  [!] psql command not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PostgreSQL might be installed but not in PATH." -ForegroundColor Yellow
    Write-Host "Common locations:" -ForegroundColor Gray
    Write-Host "  - C:\Program Files\PostgreSQL\14\bin" -ForegroundColor Gray
    Write-Host "  - C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Gray
    Write-Host "  - C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Gray
    Write-Host ""
    
    # Try to find PostgreSQL
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files\PostgreSQL\13\bin"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path (Join-Path $path "psql.exe")) {
            Write-Host "  [OK] Found PostgreSQL at: $path" -ForegroundColor Green
            $env:Path += ";$path"
            $psqlPath = Join-Path $path "psql.exe"
            break
        }
    }
    
    if (-not $psqlPath) {
        Write-Host "  [X] Could not find PostgreSQL installation" -ForegroundColor Red
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "  2. Or use Docker: docker run --name documan-postgres -e POSTGRES_PASSWORD=$Password -p 5432:5432 -d postgres:14" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

Write-Host "  [OK] PostgreSQL found: $psqlPath" -ForegroundColor Green
Write-Host ""

# Test 2: Check PostgreSQL service
Write-Host "[2/4] Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' } | Select-Object -First 1

if ($pgService) {
    Write-Host "  [OK] PostgreSQL service is running: $($pgService.DisplayName)" -ForegroundColor Green
} else {
    Write-Host "  [X] PostgreSQL service is not running" -ForegroundColor Red
    Write-Host "  Please start PostgreSQL service in Services (services.msc)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 3: Test database connection
Write-Host "[3/4] Testing database connection..." -ForegroundColor Yellow
Write-Host "  Trying to connect with password: [hidden]" -ForegroundColor Gray

$env:PGPASSWORD = $Password
$connectionTest = & psql -U $dbUser -h $dbHost -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Connection successful!" -ForegroundColor Green
    $version = $connectionTest | Select-String "PostgreSQL" | Select-Object -First 1
    Write-Host "  Version: $version" -ForegroundColor Gray
} else {
    Write-Host "  [X] Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error message:" -ForegroundColor Yellow
    Write-Host $connectionTest -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Wrong password - Try running: .\setup-database.ps1 -Password 'your_password'" -ForegroundColor White
    Write-Host "  2. PostgreSQL not configured for password authentication" -ForegroundColor White
    Write-Host "  3. Edit pg_hba.conf to allow password authentication" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host ""

# Test 4: Create/check database
Write-Host "[4/4] Setting up database..." -ForegroundColor Yellow

# Check if database exists
$dbExists = & psql -U $dbUser -h $dbHost -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1

if ($dbExists -match "1") {
    Write-Host "  [OK] Database '$dbName' already exists" -ForegroundColor Green
} else {
    Write-Host "  Creating database '$dbName'..." -ForegroundColor Gray
    $createDb = & psql -U $dbUser -h $dbHost -d postgres -c "CREATE DATABASE $dbName;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "  [X] Failed to create database" -ForegroundColor Red
        Write-Host $createDb -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Run migrations
Write-Host "[BONUS] Running database migrations..." -ForegroundColor Yellow
Push-Location backend

if (Test-Path "node_modules\.bin\sequelize") {
    $migrate = & node_modules\.bin\sequelize db:migrate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Migrations completed successfully" -ForegroundColor Green
        Write-Host $migrate | Select-String "migrated" -ForegroundColor Gray
    } else {
        Write-Host "  [!] Migrations failed (may need to fix manually)" -ForegroundColor Yellow
        Write-Host $migrate -ForegroundColor Gray
    }
} else {
    Write-Host "  [!] Sequelize CLI not found. Run: npm install" -ForegroundColor Yellow
}

Pop-Location
Write-Host ""

# Success
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database:   $dbName" -ForegroundColor White
Write-Host "Connection: postgresql://$dbUser@$dbHost:5432/$dbName" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update backend/.env with your PostgreSQL password if needed" -ForegroundColor White
Write-Host "  2. Run: .\start-simple.ps1" -ForegroundColor White
Write-Host ""

# Clean up
$env:PGPASSWORD = $null
