# Starts the RWB backend with real email delivery enabled (Windows PowerShell).
# Usage:
#   cd backend
#   Copy .env.example to .env, fill in your SMTP credentials, then:
#   .\run-mail.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "error: $envFile not found. Copy .env.example to .env and fill in your SMTP credentials." -ForegroundColor Red
    exit 1
}

# Load .env variables (strip CRLF, skip comments and blanks)
Get-Content $envFile | ForEach-Object {
    $line = $_ -replace "`r", ""
    if ($line -match "^\s*#") { return }
    if ($line -match "^\s*$") { return }
    if ($line -match "^\s*(\w+)\s*=\s*(.+)$") {
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Validate required vars when mail is enabled
if ($env:MAIL_ENABLED -eq "true") {
    $missing = @()
    if (-not $env:MAIL_HOST)     { $missing += "MAIL_HOST" }
    if (-not $env:MAIL_USERNAME) { $missing += "MAIL_USERNAME" }
    if (-not $env:MAIL_PASSWORD) { $missing += "MAIL_PASSWORD" }
    if (-not $env:MAIL_FROM)     { $missing += "MAIL_FROM" }

    if ($missing.Count -gt 0) {
        Write-Host "error: mail is enabled but these are empty in $envFile : $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Fill them in first (see .env.example for Gmail values)." -ForegroundColor Red
        exit 1
    }
    Write-Host "mail enabled -> verification emails will be sent via $($env:MAIL_HOST):$($env:MAIL_PORT)" -ForegroundColor Green
} else {
    Write-Host "mail disabled -> dev fallback, code returned by API" -ForegroundColor Yellow
}

Write-Host "Starting RWB backend with email delivery..." -ForegroundColor Cyan
& java -jar target\rwb-review-backend-0.1.0-SNAPSHOT.jar
