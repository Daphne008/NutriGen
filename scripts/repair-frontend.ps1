# Rebuild frontend and start production server (fixes missing CSS / unstyled pages on Windows).
# Run: powershell -ExecutionPolicy Bypass -File "C:\Users\ouz\Desktop\scripts\repair-frontend.ps1"

$ErrorActionPreference = "Stop"
$Frontend = Join-Path (Split-Path -Parent $PSScriptRoot) "frontend"

if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Error "Frontend folder not found: $Frontend"
}

$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
if ($p) {
    Write-Host "Stopping process on port 3000 (PID $p)..." -ForegroundColor Yellow
    Stop-Process -Id $p -Force
}

Set-Location -LiteralPath $Frontend
Write-Host "Removing .next cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

Write-Host "Running npm run build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Fix errors above, then run this script again." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Starting production server on http://localhost:3000 ..." -ForegroundColor Green
npm run start -- --hostname 0.0.0.0 --port 3000
