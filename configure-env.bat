@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js est introuvable sur ce PC.
    echo Lancez d'abord setup.bat pour installer le projet.
    echo.
    pause
    exit /b 1
)

node "%~dp0scripts\configure-env.js"
pause
exit /b 0

