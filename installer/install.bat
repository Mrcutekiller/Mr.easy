@echo off
setlocal EnableDelayedExpansion
title MR.easy Installer

echo.
echo   ╔══════════════════════════════════════════════╗
echo   ║    MR.easy  —  The Simple Web Language        ║
echo   ║             Ethiopian Made                    ║
echo   ╚══════════════════════════════════════════════╝
echo.

:: ── Get the project directory (one level up from /installer) ──────────────────
set "INSTALLER_DIR=%~dp0"
:: Remove trailing backslash from installer dir
set "INSTALLER_DIR=%INSTALLER_DIR:~0,-1%"
:: Go up one level to project root
for %%I in ("%INSTALLER_DIR%") do set "PROJECT_DIR=%%~dpI"
:: Remove trailing backslash
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo   Project: %PROJECT_DIR%
echo.

:: ── Check Node.js ──────────────────────────────────────────────────────────────
echo   [1/4] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Node.js not found!
    echo   Please install from: https://nodejs.org
    echo   Then run this installer again.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   OK: Node.js %%v found

:: ── Install npm dependencies ───────────────────────────────────────────────────
echo.
echo   [2/4] Installing dependencies...
cd /d "%PROJECT_DIR%"
call npm install --silent 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo   OK: Dependencies installed

:: ── Install mreasy globally ────────────────────────────────────────────────────
echo.
echo   [3/4] Installing mreasy command globally...
cd /d "%PROJECT_DIR%"
call npm install -g . 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   OK: mreasy installed globally via npm
    goto :vscode_ext
)

:: Fallback: manual install if npm -g fails (e.g., permission issues)
echo   Trying manual install (no admin needed)...
set "INSTALL_DIR=%LOCALAPPDATA%\MReasy"
set "BIN_DIR=%LOCALAPPDATA%\MReasy\bin"

if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%"
mkdir "%BIN_DIR%"

:: Copy core files
xcopy "%PROJECT_DIR%\cli"          "%INSTALL_DIR%\cli\"  /E /I /Q /Y
xcopy "%PROJECT_DIR%\core"         "%INSTALL_DIR%\core\" /E /I /Q /Y
copy "%PROJECT_DIR%\package.json"  "%INSTALL_DIR%\package.json" /Y

:: Install npm deps inside install dir
cd /d "%INSTALL_DIR%"
call npm install --silent 2>nul

:: Write mreasy.cmd launcher
echo @echo off > "%BIN_DIR%\mreasy.cmd"
echo node "%INSTALL_DIR%\cli\index.js" %%* >> "%BIN_DIR%\mreasy.cmd"

:: Add BIN_DIR to user PATH permanently
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%b"
echo %CURRENT_PATH% | findstr /i "MReasy\bin" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "%CURRENT_PATH%;%BIN_DIR%" /f >nul
    echo   OK: Added %BIN_DIR% to PATH
)
set "PATH=%PATH%;%BIN_DIR%"
echo   OK: Manual install complete

:vscode_ext
:: ── Install VS Code extension ──────────────────────────────────────────────────
echo.
echo   [4/4] Installing VS Code extension...
set "EXT_SRC=%PROJECT_DIR%\vscode-extension"
set "EXT_DST=%USERPROFILE%\.vscode\extensions\mreasy-vscode-1.0.0"

if exist "%EXT_SRC%" (
    if exist "%EXT_DST%" rmdir /s /q "%EXT_DST%"
    xcopy "%EXT_SRC%" "%EXT_DST%\" /E /I /Q /Y
    echo   OK: VS Code extension installed - .mreasy files get syntax highlighting!
) else (
    echo   (VS Code extension not found, skipping)
)

:: ── Create Desktop shortcut ────────────────────────────────────────────────────
echo.
echo   Creating Desktop shortcut...
set "SHORTCUT=%USERPROFILE%\Desktop\MR.easy IDE.url"
echo [InternetShortcut] > "%SHORTCUT%"
echo URL=https://mr-easy.vercel.app/ide >> "%SHORTCUT%"
echo   OK: Desktop shortcut created

:: ── Done ──────────────────────────────────────────────────────────────────────
echo.
echo   ╔══════════════════════════════════════════════╗
echo   ║    OK  MR.easy installed successfully!        ║
echo   ╚══════════════════════════════════════════════╝
echo.
echo   Quick Start:
echo.
echo     1. Open a NEW terminal (important!)
echo     2. Run:  mreasy new mywebsite
echo     3.       cd mywebsite
echo     4.       mreasy run
echo.
echo   Online IDE:
echo     https://mr-easy.vercel.app/ide
echo.
pause
