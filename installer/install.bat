@echo off
title MR.easy Installer
color 0B
cls

echo.
echo  =====================================================
echo   __  __ ____                         
echo  ^|  \/  ^|  _ \   ___  __ _ ___ _   _ 
echo  ^| ^|\/^| ^| ^|_) ^| / _ \/ _` / __^| ^| ^| ^|
echo  ^| ^|  ^| ^|  _ < ^|  __/ (_^| \__ \ ^|_^| ^|
echo  ^|_^|  ^|_^|_^| \_\ \___^|\__,_^|___/\__, ^|
echo                                ^|___/ 
echo.
echo  The simple, beautiful web programming language
echo  =====================================================
echo.

:: Check if running as admin
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Please run this installer as Administrator
    echo      Right-click install.bat and choose "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo  [*] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Node.js is not installed.
    echo  [*] Opening download page...
    start https://nodejs.org/en/download
    echo.
    echo  Please install Node.js, then run this installer again.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found

echo.
echo  [*] Installing MR.easy dependencies...
cd /d "%~dp0"
call npm install --silent

if %ERRORLEVEL% NEQ 0 (
    echo  [!] Failed to install dependencies
    pause
    exit /b 1
)

echo  [OK] Dependencies installed

echo.
echo  [*] Installing MR.easy globally...
call npm install -g . --silent 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo  [!] Global install failed. Trying alternative method...
    
    :: Create a wrapper script in a PATH directory
    set "INSTALL_DIR=%USERPROFILE%\AppData\Local\MReasy"
    if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
    
    :: Copy files
    xcopy /s /e /i /q "%~dp0" "%INSTALL_DIR%\" >nul
    
    :: Create the mreasy.cmd wrapper
    echo @echo off > "%USERPROFILE%\AppData\Local\MReasy\mreasy.cmd"
    echo node "%USERPROFILE%\AppData\Local\MReasy\cli\index.js" %%* >> "%USERPROFILE%\AppData\Local\MReasy\mreasy.cmd"
    
    :: Add to PATH
    setx PATH "%PATH%;%USERPROFILE%\AppData\Local\MReasy" /M >nul 2>&1
    setx PATH "%PATH%;%USERPROFILE%\AppData\Local\MReasy" >nul 2>&1
    
    echo  [OK] MR.easy installed to %INSTALL_DIR%
)

echo  [OK] MR.easy command registered

echo.
echo  =====================================================
echo  [SUCCESS] MR.easy installed successfully!
echo  =====================================================
echo.
echo  Quick Start:
echo.
echo    mreasy new mywebsite    Create a new website
echo    cd mywebsite
echo    mreasy run              Start live preview
echo.
echo  Open the Web IDE:
echo    Start  ide\index.html  in your browser
echo.
echo  =====================================================
echo.
pause
