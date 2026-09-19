# AarogyaSaar SIH26047 - PowerShell launcher
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is not installed." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is not installed." }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python is not installed." }

if (-not (Test-Path "$root\backend\node_modules")) {
  Push-Location "$root\backend"; npm install; Pop-Location
}
if (-not (Test-Path "$root\frontend\node_modules")) {
  Push-Location "$root\frontend"; npm install; Pop-Location
}
$py = "$root\ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
  Push-Location "$root\ai-service"
  python -m venv .venv
  & $py -m pip install --upgrade pip
  & $py -m pip install -r requirements.txt
  Pop-Location
}

Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\ai-service`" && `".venv\Scripts\python.exe`" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\backend`" && npm start"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev"

Write-Host "AarogyaSaar services are starting." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3000/api-docs"
Write-Host "AI:       http://localhost:8000/docs"
Start-Sleep -Seconds 6
Start-Process "http://localhost:5173"
