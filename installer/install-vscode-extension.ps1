# MR.easy VS Code Extension Installer
$extSrc = Join-Path $PSScriptRoot "..\vscode-extension"
$extDst = Join-Path $env:USERPROFILE ".vscode\extensions\mreasy-vscode-1.0.0"

Write-Host "Installing MR.easy syntax support into VS Code..." -ForegroundColor Gold

if (Test-Path $extSrc) {
    if (Test-Path $extDst) {
        Remove-Item -Path $extDst -Recurse -Force
    }
    Copy-Item -Path $extSrc -Destination $extDst -Recurse -Force
    Write-Host "✓ Installed MR.easy VS Code Extension successfully!" -ForegroundColor Green
    Write-Host "VS Code will now automatically recognize and highlight .mreasy files!" -ForegroundColor Cyan
} else {
    Write-Host "Error: vscode-extension folder not found." -ForegroundColor Red
}
