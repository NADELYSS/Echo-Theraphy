@echo off
echo ====================================================
echo    Echo Therapy - Full-Stack Graduation Project
echo ====================================================

echo [1/2] Starting Backend (Node.js API) server on port 4000...
start "Echo Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend (React) server...
start "Echo Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 3 seconds for servers to start...
timeout /t 3 >nul

echo Opening Browser...
start http://localhost:5173
