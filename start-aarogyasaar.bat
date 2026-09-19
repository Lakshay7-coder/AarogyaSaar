@echo off
setlocal
title AarogyaSaar SIH26047 - One Click Launcher
cd /d "%~dp0"

echo ================================================================
echo   AAROGYASAAR SIH26047 - ONE CLICK DEMO LAUNCHER
echo ================================================================
echo.

where node >nul 2>&1 || (echo [ERROR] Node.js is not installed.& pause & exit /b 1)
where npm >nul 2>&1 || (echo [ERROR] npm is not installed.& pause & exit /b 1)
where python >nul 2>&1 || (echo [ERROR] Python is not installed.& pause & exit /b 1)

if not exist "backend\node_modules" (
  echo [SETUP] Installing backend dependencies...
  pushd backend
  call npm install
  if errorlevel 1 (popd & echo Backend dependency install failed.& pause & exit /b 1)
  popd
)
if not exist "frontend\node_modules" (
  echo [SETUP] Installing frontend dependencies...
  pushd frontend
  call npm install
  if errorlevel 1 (popd & echo Frontend dependency install failed.& pause & exit /b 1)
  popd
)

if not exist "ai-service\.venv\Scripts\python.exe" (
  echo [SETUP] Creating isolated Python environment...
  pushd ai-service
  python -m venv .venv
  if errorlevel 1 (popd & echo Python venv creation failed.& pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install --upgrade pip
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (popd & echo AI dependency install failed.& pause & exit /b 1)
  popd
)

echo.
echo [1/3] Starting AI + OCR service on port 8000...
start "AarogyaSaar AI - 8000" cmd /k "cd /d ""%~dp0ai-service"" && "".venv\Scripts\python.exe"" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Starting Node backend on port 3000...
start "AarogyaSaar Backend - 3000" cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [3/3] Starting React frontend on port 5173...
start "AarogyaSaar Frontend - 5173" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ================================================================
echo   Open: http://localhost:5173
echo   API:  http://localhost:3000/api-docs
echo   AI:   http://localhost:8000/docs
echo ================================================================
echo.
timeout /t 6 /nobreak >nul
start http://localhost:5173
echo.
echo Keep the three service windows open while presenting.
pause
