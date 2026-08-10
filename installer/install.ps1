# ═══════════════════════════════════════════════════════════════
#  MR.easy — Installer
#  Works from ANY directory. Run with:
#    powershell -ExecutionPolicy Bypass -File install.ps1
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ── Banner ─────────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║    MR.easy  —  The Simple Web Language 🚀    ║" -ForegroundColor Cyan
Write-Host "  ║             Ethiopian Made  🇪🇹               ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Helpers ────────────────────────────────────────────────────
function Step($msg)  { Write-Host "  → $msg" -ForegroundColor Yellow }
function OK($msg)    { Write-Host "  ✓ $msg"  -ForegroundColor Green  }
function Fail($msg)  { Write-Host "  ✗ $msg"  -ForegroundColor Red    }

# ── 1. Resolve project root (one level up from /installer) ─────
$installerDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir   = Split-Path -Parent $installerDir
Write-Host "  Project: $projectDir" -ForegroundColor Gray
Write-Host ""

# ── 2. Check Node.js ───────────────────────────────────────────
Step "Checking Node.js..."
$nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if (-not $nodePath) {
    Fail "Node.js not found!"
    Write-Host ""
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Cyan
    Start-Process "https://nodejs.org/en/download"
    Write-Host "  Then run this installer again." -ForegroundColor Yellow
    Read-Host "  Press Enter to exit"
    exit 1
}
$nodeVer = node --version
OK "Node.js $nodeVer found"

# ── 3. Install dependencies in project ─────────────────────────
Step "Installing dependencies..."
Push-Location $projectDir
try {
    npm install --silent 2>&1 | Out-Null
    OK "Dependencies ready"
} catch {
    Fail "npm install failed: $_"
    Pop-Location; exit 1
}

# ── 4. Install mreasy globally using npm ───────────────────────
Step "Installing mreasy command globally..."
try {
    # Run npm install -g . FROM the project directory (with package.json)
    $result = npm install -g . 2>&1
    OK "mreasy command installed globally"
} catch {
    # Fallback: manual install to LOCALAPPDATA
    Fail "npm global install failed. Trying manual install..."

    $installDir = "$env:LOCALAPPDATA\MReasy"
    if (Test-Path $installDir) { Remove-Item $installDir -Recurse -Force }
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null

    # Copy project files (exclude node_modules to save space, reinstall fresh)
    Copy-Item "$projectDir\cli"              "$installDir\cli"              -Recurse -Force
    Copy-Item "$projectDir\core"             "$installDir\core"             -Recurse -Force
    Copy-Item "$projectDir\package.json"     "$installDir\package.json"     -Force
    Copy-Item "$projectDir\package-lock.json" "$installDir\package-lock.json" -Force -ErrorAction SilentlyContinue

    Push-Location $installDir
    npm install --silent 2>&1 | Out-Null
    Pop-Location

    # Create .cmd wrapper so mreasy works from any terminal
    $cmd = "@echo off`r`nnode `"$installDir\cli\index.js`" %*"
    $binDir = "$env:LOCALAPPDATA\MReasy\bin"
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    Set-Content -Path "$binDir\mreasy.cmd" -Value $cmd -Encoding ASCII
    Set-Content -Path "$binDir\mreasy"     -Value "#!/bin/sh`nnode `"$installDir/cli/index.js`" `"`$@`"" -Encoding ASCII

    # Add bin dir to user PATH
    $curPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($curPath -notlike "*MReasy\bin*") {
        [Environment]::SetEnvironmentVariable("PATH", "$curPath;$binDir", "User")
        OK "Added $binDir to user PATH"
    }
    $env:PATH = "$env:PATH;$binDir"
    OK "Manual install complete: $installDir"
}

Pop-Location

# ── 5. Verify mreasy is available ──────────────────────────────
Step "Verifying installation..."
# Refresh PATH in current session
$npmBin = (npm root -g 2>$null).Replace("node_modules","") + ".bin"
$env:PATH = "$env:PATH;$npmBin"

$mreasyPath = (Get-Command mreasy -ErrorAction SilentlyContinue)?.Source
if ($mreasyPath) {
    OK "mreasy found at: $mreasyPath"
} else {
    Write-Host "  ⚠ mreasy installed but not yet in PATH of this session." -ForegroundColor Yellow
    Write-Host "  → Open a new terminal and run: mreasy help" -ForegroundColor Cyan
}

# ── 6. Install VS Code extension ───────────────────────────────
Step "Installing VS Code extension (.mreasy syntax highlighting)..."
$extSrc = "$projectDir\vscode-extension"
$extDst = "$env:USERPROFILE\.vscode\extensions\mreasy-vscode-1.0.0"
if (Test-Path $extSrc) {
    try {
        if (Test-Path $extDst) { Remove-Item $extDst -Recurse -Force }
        Copy-Item $extSrc $extDst -Recurse -Force
        OK "VS Code extension installed — .mreasy files get syntax highlighting!"
    } catch {
        Write-Host "  (Could not install VS Code extension)" -ForegroundColor Gray
    }
} else {
    Write-Host "  (VS Code extension not found, skipping)" -ForegroundColor Gray
}

# ── 7. Desktop shortcut to online IDE ──────────────────────────
Step "Creating Desktop shortcut..."
try {
    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut("$env:USERPROFILE\Desktop\MR.easy IDE.lnk")
    $sc.TargetPath    = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $sc.Arguments     = "https://mr-easy.vercel.app/ide"
    $sc.Description   = "Open MR.easy Web IDE"
    $sc.IconLocation  = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
    $sc.Save()
    OK "Desktop shortcut → Opens MR.easy IDE in browser"
} catch {
    Write-Host "  (Could not create shortcut)" -ForegroundColor Gray
}

# ── Done ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║    ✓ MR.easy installed successfully!         ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Quick Start:" -ForegroundColor White
Write-Host ""
Write-Host "    mreasy new mywebsite" -ForegroundColor Cyan
Write-Host "    cd mywebsite" -ForegroundColor Cyan
Write-Host "    mreasy run" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Or open the online IDE at:" -ForegroundColor White
Write-Host "    https://mr-easy.vercel.app/ide" -ForegroundColor Cyan
Write-Host ""
Write-Host "  NOTE: Open a NEW terminal window for mreasy to work." -ForegroundColor Yellow
Write-Host ""
Read-Host "  Press Enter to finish"
