@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================
echo   Installation de Balatroce
echo ============================================
echo.
echo Ce script va :
echo   1. Installer Node.js 22 si besoin
echo   2. Installer et compiler le projet
echo   3. Configurer les variables d'environnement necessaires
echo   4. Verifier/installer les mods dans Balatro
echo.
pause

call :ensure_node
if errorlevel 1 (
    echo.
    echo [ERREUR] Node.js n'a pas pu etre installe automatiquement.
    echo Merci d'installer Node.js 22 manuellement depuis https://nodejs.org/
    echo puis relancez ce script.
    echo.
    pause
    exit /b 1
)

echo.
echo Node.js est pret. Poursuite de l'installation...
echo.

node "%~dp0scripts\setup.js"
if errorlevel 1 (
    echo.
    echo [ERREUR] L'installation a rencontre un probleme. Voir les messages ci-dessus.
    pause
    exit /b 1
)

echo.
pause
exit /b 0

:ensure_node
rem --- Verifie si Node.js 22+ est deja installe et accessible ---
where node >nul 2>nul
if not errorlevel 1 (
    for /f "delims=" %%v in ('node -e "console.log(process.versions.node.split('.')[0])" 2^>nul') do set NODE_MAJOR=%%v
    if defined NODE_MAJOR (
        if !NODE_MAJOR! GEQ 22 (
            echo Node.js !NODE_MAJOR! deja installe.
            exit /b 0
        ) else (
            echo Node.js !NODE_MAJOR! detecte, mais la version 22 ou superieure est recommandee.
        )
    )
)

echo Node.js 22+ introuvable. Tentative d'installation automatique...
echo.

rem --- Tentative via winget (present par defaut sur Windows 10/11 recents) ---
where winget >nul 2>nul
if not errorlevel 1 (
    echo Installation via winget...
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
    call :refresh_path
    where node >nul 2>nul
    if not errorlevel 1 (
        echo Node.js installe avec succes via winget.
        exit /b 0
    )
    echo winget n'a pas permis d'installer Node.js, on continue avec un autre outil...
    echo.
) else (
    echo winget n'est pas disponible sur ce PC.
)

rem --- Tentative via Chocolatey, si deja installe ---
where choco >nul 2>nul
if not errorlevel 1 (
    echo Installation via Chocolatey...
    choco install nodejs-lts -y
    call :refresh_path
    where node >nul 2>nul
    if not errorlevel 1 (
        echo Node.js installe avec succes via Chocolatey.
        exit /b 0
    )
    echo Chocolatey n'a pas permis d'installer Node.js.
    echo.
) else (
    echo Chocolatey n'est pas disponible sur ce PC.
)

exit /b 1

:refresh_path
rem --- Ajoute les emplacements habituels de Node.js au PATH de cette session ---
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%ProgramData%\chocolatey\bin\node.exe" set "PATH=%ProgramData%\chocolatey\bin;%PATH%"
exit /b 0
