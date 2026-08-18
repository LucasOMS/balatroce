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

echo Ce script va retirer toutes les variables d'environnement de balatroce.
echo.
pause

node "%~dp0scripts\reset-env.js"
pause
exit /b 0

