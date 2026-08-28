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
rem --- Check whether Node.js 22+ is already installed and available ---
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

rem --- Try winget first (available by default on recent Windows 10/11 systems) ---
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

rem --- Try Chocolatey when it is already installed ---
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
rem --- Add Node.js locations to both the current session and the persistent user PATH ---
if exist "%ProgramFiles%\nodejs\node.exe" call :add_to_path "%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" call :add_to_path "%ProgramFiles(x86)%\nodejs"
if exist "%ProgramData%\chocolatey\bin\node.exe" call :add_to_path "%ProgramData%\chocolatey\bin"
exit /b 0

:add_to_path
set "PATH_ENTRY=%~1"

rem --- Make the executable immediately available to the current setup process ---
echo ;!PATH!; | findstr /I /C:";!PATH_ENTRY!;" >nul
if errorlevel 1 set "PATH=!PATH_ENTRY!;!PATH!"

rem --- Persist the entry for future processes without duplicating existing entries ---
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$entry = [Environment]::ExpandEnvironmentVariables('%PATH_ENTRY%');" ^
    "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User');" ^
    "$entries = @($userPath -split ';' | Where-Object { $_ });" ^
    "if (-not ($entries | Where-Object { $_.TrimEnd('\\') -ieq $entry.TrimEnd('\\') })) {" ^
    "  $newPath = (($entries + $entry) -join ';');" ^
    "  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User');" ^
    "}"

if errorlevel 1 (
    echo [ERREUR] Impossible d'ajouter %PATH_ENTRY% au PATH utilisateur.
    exit /b 1
)

exit /b 0
