# Loads .env and starts the RWB backend with email delivery enabled.
# Usage: powershell -File run-with-mail.ps1

Set-Location $PSScriptRoot

if (!(Test-Path .env)) {
    Write-Error ".env not found. Copy .env.example to .env and fill in your SMTP credentials."
    exit 1
}

# Load .env into process environment
Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

if ($env:MAIL_ENABLED -eq 'true') {
    Write-Host "mail enabled -> verification codes will be emailed via $($env:MAIL_HOST):$($env:MAIL_PORT)" -ForegroundColor Green
} else {
    Write-Host "mail disabled -> dev fallback, code shown on screen" -ForegroundColor Yellow
}

$port = if ($env:SERVER_PORT) { $env:SERVER_PORT } else { '8080' }
Write-Host "Starting backend on port $port..."
java -jar target/rwb-review-backend-0.1.0-SNAPSHOT.jar
