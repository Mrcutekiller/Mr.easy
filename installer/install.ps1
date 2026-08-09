# MR.easy PowerShell Installer
# Run with: powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                              ║" -ForegroundColor Cyan
    Write-Host "  ║   Mr.easy  —  The Simple Web Language 🚀    ║" -ForegroundColor Cyan
    Write-Host "  ║                                              ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step($msg) {
    Write-Host "  [*] $msg" -ForegroundColor Yellow
}

function Write-OK($msg) {
    Write-Host "  [✓] $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "  [✗] $msg" -ForegroundColor Red
}

Write-Banner

# ── Check Node.js ─────────────────────────────────────────────────────────────
Write-Step "Checking Node.js..."
try {
    $nodeVer = (node --version 2>&1)
    Write-OK "Node.js $nodeVer found"
} catch {
    Write-Err "Node.js is not installed!"
    Write-Host ""
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Cyan
    Start-Process "https://nodejs.org/en/download"
    Write-Host "  Then run this installer again." -ForegroundColor Yellow
    Read-Host "  Press Enter to exit"
    exit 1
}

# ── Install Dependencies ──────────────────────────────────────────────────────
Write-Step "Installing dependencies..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Push-Location $projectDir
try {
    npm install --silent 2>&1 | Out-Null
    Write-OK "Dependencies installed"
} catch {
    Write-Err "Failed to install dependencies: $_"
    Pop-Location
    exit 1
}

# ── Register Global Command ───────────────────────────────────────────────────
Write-Step "Registering mreasy command..."

$installDir = "$env:LOCALAPPDATA\MReasy"
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Copy entire project
Copy-Item -Path "$projectDir\*" -Destination $installDir -Recurse -Force

# Create mreasy.cmd
$cmdContent = "@echo off`nnode `"$installDir\cli\index.js`" %*"
Set-Content -Path "$installDir\mreasy.cmd" -Value $cmdContent

# Create mreasy.ps1
$ps1Content = "node `"$installDir\cli\index.js`" @args"
Set-Content -Path "$installDir\mreasy.ps1" -Value $ps1Content

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*MReasy*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$installDir", "User")
    Write-OK "Added to PATH"
}

# Also add to current session PATH
$env:PATH = "$env:PATH;$installDir"

Write-OK "MR.easy installed to $installDir"

# ── Create Desktop Shortcut to IDE ───────────────────────────────────────────
Write-Step "Creating IDE shortcut..."
try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut("$env:USERPROFILE\Desktop\MR.easy IDE.lnk")
    $shortcut.TargetPath = "$installDir\ide\index.html"
    $shortcut.Description = "Open MR.easy Web IDE"
    $shortcut.Save()
    Write-OK "IDE shortcut created on Desktop"
} catch {
    Write-Host "  (Could not create shortcut)" -ForegroundColor Gray
}

Pop-Location

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  ✓  MR.easy installed successfully!         ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Quick Start:" -ForegroundColor White
Write-Host ""
Write-Host "    mreasy new mywebsite" -ForegroundColor Cyan -NoNewline
Write-Host "    ← Create a new website" -ForegroundColor Gray
Write-Host "    cd mywebsite" -ForegroundColor Cyan
Write-Host "    mreasy run" -ForegroundColor Cyan -NoNewline
Write-Host "             ← Start live preview" -ForegroundColor Gray
Write-Host ""
Write-Host "  Web IDE:" -ForegroundColor White
Write-Host "    Double-click 'MR.easy IDE' on your Desktop" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Restart your terminal to use the mreasy command." -ForegroundColor Yellow
Write-Host ""
Read-Host "  Press Enter to finish"
