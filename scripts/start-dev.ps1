# Dietitian Support Platform - local development starter (Windows)
# Opens two PowerShell windows: backend (4000) and frontend (3000).
# Frontend runs `npm run demo` (production build + start). This avoids Windows dev-cache bugs where
# `/_next/static/*` returns 404 and the site renders with no CSS. Custom hosts (e.g. nutriplan.com) still work.
#
# Prerequisites (one-time):
#   - Node.js installed
#   - PostgreSQL running; backend\.env exists with correct DATABASE_URL
#   - Already ran: npm install, prisma migrate, seed in backend and npm install in frontend
#
# Usage:
#   Right-click -> Run with PowerShell
#   OR from any terminal:  powershell -ExecutionPolicy Bypass -File "C:\Users\ouz\Desktop\scripts\start-dev.ps1"

$ErrorActionPreference = "Stop"
$DesktopRoot = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $DesktopRoot "backend"
$Frontend = Join-Path $DesktopRoot "frontend"

if (-not (Test-Path (Join-Path $Backend "package.json"))) {
    Write-Error "Backend folder not found: $Backend"
}
if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Error "Frontend folder not found: $Frontend"
}

Write-Host "Starting backend in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-NoLogo",
    "-Command",
    "Set-Location -LiteralPath '$Backend'; Write-Host 'BACKEND (port 4000)' -ForegroundColor Cyan; npm run dev"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend in a new window..." -ForegroundColor Green
$FrontendStarter = Join-Path $PSScriptRoot "start-frontend-prod.ps1"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-NoLogo",
    "-File",
    $FrontendStarter,
    "-FrontendRoot",
    $Frontend
)

Write-Host ""
Write-Host "Done. Open http://localhost:3000 or http://nutriplan.com:3000 (if hosts is set)." -ForegroundColor Yellow
Write-Host "Close the two PowerShell windows when you want to stop the servers." -ForegroundColor Gray
