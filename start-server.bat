@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Demarrage de Balatroce
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js est introuvable sur ce PC.
    echo Lancez d'abord setup.bat pour installer le projet.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [ERREUR] Le projet ne semble pas installe ^(dossier node_modules introuvable^).
    echo Lancez d'abord setup.bat.
    echo.
    pause
    exit /b 1
)

if not exist "dist\src\main.js" (
    echo Le serveur n'est pas encore compile, compilation en cours...
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERREUR] La compilation a echoue. Voir les messages ci-dessus.
        pause
        exit /b 1
    )
)

echo Demarrage du serveur balatroce ^(npm run start:prod^)...
start "Balatroce - Serveur" cmd /k "cd /d "%~dp0" && npm run start:prod"

if exist "overlay\package.json" (
    if exist "overlay\node_modules" (
        echo Demarrage de l'overlay ^(npm run start:prod^)...
        start "Balatroce - Overlay" cmd /k "cd /d "%~dp0overlay" && npm run start:prod"
    ) else (
        echo [ATTENTION] Dependances de l'overlay introuvables ^(overlay\node_modules^).
        echo Lancez setup.bat, ou installez-les manuellement avec : cd overlay ^&^& npm install
    )
) else (
    echo [ATTENTION] Dossier overlay introuvable, l'overlay n'a pas ete demarre.
)

echo.
echo Le serveur ^(et l'overlay, si disponible^) demarrent dans de nouvelles fenetres.
echo Vous pouvez fermer cette fenetre.
echo.
pause
exit /b 0


