# Repak X Extension Build Script
# Generates browser-specific packages for Chrome and Firefox

param(
    [string]$Target = "all"  # Options: "chrome", "firefox", "all"
)

$SourceDir = $PSScriptRoot
$DistDir = Join-Path $SourceDir "dist"

# Files/folders to copy (excluding manifest files and build artifacts)
$FilesToCopy = @(
    "background",
    "content",
    "icons",
    "popup",
    "browser-polyfill.js",
    "redirect.html",
    "redirect.js"
)

function Build-Chrome {
    Write-Host "Building Chrome extension..." -ForegroundColor Cyan
    
    $ChromeDir = Join-Path $DistDir "chrome"
    
    # Clean and create directory
    if (Test-Path $ChromeDir) { Remove-Item $ChromeDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ChromeDir -Force | Out-Null
    
    # Copy files
    foreach ($item in $FilesToCopy) {
        $source = Join-Path $SourceDir $item
        $dest = Join-Path $ChromeDir $item
        if (Test-Path $source) {
            if ((Get-Item $source).PSIsContainer) {
                Copy-Item $source $dest -Recurse
            }
            else {
                Copy-Item $source $dest
            }
        }
    }
    
    # Copy Chrome manifest
    Copy-Item (Join-Path $SourceDir "manifest.chrome.json") (Join-Path $ChromeDir "manifest.json")
    
    # Create ZIP package (for Chrome Web Store submission)
    $ChromeZip = Join-Path $DistDir "Repak-X-Chrome.zip"
    if (Test-Path $ChromeZip) { Remove-Item $ChromeZip -Force }
    Compress-Archive -Path "$ChromeDir\*" -DestinationPath $ChromeZip
    
    # Try to create CRX using Chrome (requires Chrome to be installed)
    $ChromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    
    $ChromeExe = $null
    foreach ($path in $ChromePaths) {
        if (Test-Path $path) {
            $ChromeExe = $path
            break
        }
    }
    
    if ($ChromeExe) {
        $PemFile = Join-Path $DistDir "Repak-X.pem"
        $CrxFile = Join-Path $DistDir "chrome.crx"
        $FinalCrx = Join-Path $DistDir "Repak-X-Chrome.crx"
        
        if (Test-Path $FinalCrx) { Remove-Item $FinalCrx -Force }
        
        if (Test-Path $PemFile) {
            # Use existing key
            & $ChromeExe --pack-extension="$ChromeDir" --pack-extension-key="$PemFile" 2>$null
        }
        else {
            # Generate new key
            & $ChromeExe --pack-extension="$ChromeDir" 2>$null
            # Move generated pem to dist folder
            $GeneratedPem = Join-Path $DistDir "chrome.pem"
            if (Test-Path $GeneratedPem) {
                Move-Item $GeneratedPem $PemFile -Force
            }
        }
        
        # Rename the output crx
        if (Test-Path $CrxFile) {
            Move-Item $CrxFile $FinalCrx -Force
            Write-Host "Chrome CRX created: $FinalCrx" -ForegroundColor Green
        }
        else {
            Write-Host "CRX creation failed - Chrome may have issues packing" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Chrome not found - CRX file not created (ZIP still available)" -ForegroundColor Yellow
    }
    
    Write-Host "Chrome build complete: $ChromeDir" -ForegroundColor Green
    Write-Host "Chrome ZIP created: $ChromeZip" -ForegroundColor Green
}

function Build-Firefox {
    Write-Host "Building Firefox extension..." -ForegroundColor Cyan
    
    $FirefoxDir = Join-Path $DistDir "firefox"
    
    # Clean and create directory
    if (Test-Path $FirefoxDir) { Remove-Item $FirefoxDir -Recurse -Force }
    New-Item -ItemType Directory -Path $FirefoxDir -Force | Out-Null
    
    # Copy files
    foreach ($item in $FilesToCopy) {
        $source = Join-Path $SourceDir $item
        $dest = Join-Path $FirefoxDir $item
        if (Test-Path $source) {
            if ((Get-Item $source).PSIsContainer) {
                Copy-Item $source $dest -Recurse
            }
            else {
                Copy-Item $source $dest
            }
        }
    }
    
    # Copy Firefox manifest
    Copy-Item (Join-Path $SourceDir "manifest.firefox.json") (Join-Path $FirefoxDir "manifest.json")
    
    # Create XPI package (XPI is just a ZIP with different extension)
    $FirefoxXpi = Join-Path $DistDir "Repak-X-Firefox.xpi"
    $FirefoxZip = Join-Path $DistDir "Repak-X-Firefox.zip"
    if (Test-Path $FirefoxZip) { Remove-Item $FirefoxZip -Force }
    if (Test-Path $FirefoxXpi) { Remove-Item $FirefoxXpi -Force }
    Compress-Archive -Path "$FirefoxDir\*" -DestinationPath $FirefoxZip
    Rename-Item $FirefoxZip $FirefoxXpi
    
    Write-Host "Firefox build complete: $FirefoxDir" -ForegroundColor Green
    Write-Host "Firefox XPI created: $FirefoxXpi" -ForegroundColor Green
}

# Main
Write-Host ""
Write-Host "=== Repak X Extension Builder ===" -ForegroundColor Yellow
Write-Host ""

switch ($Target.ToLower()) {
    "chrome" { Build-Chrome }
    "firefox" { Build-Firefox }
    "all" { 
        Build-Chrome
        Build-Firefox
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Usage: .\build.ps1 [-Target chrome|firefox|all]"
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
