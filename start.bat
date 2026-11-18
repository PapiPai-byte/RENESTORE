@echo off
echo ========================================
echo   ReneStore - Starting All Services
echo ========================================
echo.

REM Check if node_modules exists in Backend
if not exist "Backend\node_modules" (
    echo [1/4] Installing Backend dependencies...
    cd Backend
    call npm install
    cd ..
) else (
    echo [1/4] Backend dependencies already installed ✓
)

REM Check if node_modules exists in Frontend
if not exist "Frontend\node_modules" (
    echo [2/4] Installing Frontend dependencies...
    cd Frontend
    call npm install
    cd ..
) else (
    echo [2/4] Frontend dependencies already installed ✓
)

echo.
echo [3/4] Starting Backend server...
start "ReneStore Backend" cmd /k "cd Backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [4/4] Starting Frontend server...
start "ReneStore Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ========================================
echo   ✓ All services started!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Sign in using an authorized administrator account for your environment.
echo Press any key to open browser...
pause > nul
start http://localhost:5173
