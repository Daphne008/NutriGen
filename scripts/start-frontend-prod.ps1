param(
    [Parameter(Mandatory = $true)]
    [string] $FrontendRoot
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $FrontendRoot

Write-Host "FRONTEND (port 3000, production - building...)" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Starting Next.js production server..." -ForegroundColor Green
npm run start -- --hostname 0.0.0.0 --port 3000
