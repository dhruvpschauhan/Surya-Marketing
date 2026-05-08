@echo off
title QuoteForge Startup

echo ========================================================
echo   Starting QuoteForge... Please do not close the windows
echo ========================================================
echo.

:: Start the Python Backend in a new terminal window
echo [1/2] Starting Python Backend...
start "QuoteForge Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --reload --port 8000"

:: Wait 4 seconds for the backend to initialize
timeout /t 4 /nobreak > nul

:: Start the React Frontend in a new terminal window (and automatically open browser)
echo [2/2] Starting React Frontend...
start "QuoteForge Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --open"

echo.
echo Done! The app will open in your browser automatically in a few seconds.
echo You can close this small window.
timeout /t 5 > nul
exit
