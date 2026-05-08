@echo off
title QuoteForge - New PC Setup
echo ========================================================
echo   QuoteForge First-Time Setup (Installing Libraries)
echo ========================================================
echo.

:: 1. Install Backend Dependencies
echo [1/2] Installing Python libraries...
cd /d "%~dp0backend"
python -m pip install --upgrade pip
pip install -r requirements.txt

:: 2. Install Frontend Dependencies
echo.
echo [2/2] Installing Frontend libraries (this may take a minute)...
cd /d "%~dp0frontend"
npm install

echo.
echo ========================================================
echo   SETUP COMPLETE! 
echo   You can now use the "Start-QuoteForge.bat" normally.
echo ========================================================
pause
exit
