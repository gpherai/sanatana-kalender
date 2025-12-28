#!/usr/bin/env pwsh
# Dharma Calendar - Backup Script
# Maakt een zip backup van het project zonder node_modules, .next, etc.

param(
    [string]$BackupDir = "C:\backups\dharma-calendar",
    [switch]$NoZip
)

$ProjectDir = "C:\projects\kalender-site"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupName = "dharma-calendar_$Timestamp"

# Mappen en bestanden om te excluden
$ExcludeDirs = @(
    "node_modules",
    ".next",
    ".turbo",
    "dist",
    "build",
    ".git",
    "src\generated"
)

$ExcludeFiles = @(
    "*.log",
    ".env.local",
    "nul"
)

Write-Host ""
Write-Host "Dharma Calendar Backup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $ProjectDir"
Write-Host "Backup: $BackupDir\$BackupName"
Write-Host ""

# Maak backup directory als die niet bestaat
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[OK] Backup directory aangemaakt: $BackupDir" -ForegroundColor Green
}

# Tijdelijke directory voor backup
$TempBackupDir = Join-Path $BackupDir $BackupName

# Kopieer bestanden met exclusies
Write-Host "[..] Bestanden kopieren..." -ForegroundColor Yellow

# Bouw robocopy argumenten
$RobocopyArgs = @(
    $ProjectDir,
    $TempBackupDir,
    "/E",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NC",
    "/NS"
)

# Voeg exclude directories toe
foreach ($dir in $ExcludeDirs) {
    $RobocopyArgs += "/XD"
    $RobocopyArgs += $dir
}

# Voeg exclude files toe
foreach ($file in $ExcludeFiles) {
    $RobocopyArgs += "/XF"
    $RobocopyArgs += $file
}

# Voer robocopy uit
$null = & robocopy @RobocopyArgs

Write-Host "[OK] Bestanden gekopieerd" -ForegroundColor Green

# Maak zip bestand
if (-not $NoZip) {
    Write-Host "[..] ZIP bestand maken..." -ForegroundColor Yellow

    $ZipPath = "$TempBackupDir.zip"

    # Verwijder bestaand zip bestand als het bestaat
    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }

    # Verwijder problematische device files voor ZIP creatie
    Write-Host "[..] Controleren op device files..." -ForegroundColor Yellow
    Get-ChildItem $TempBackupDir -Filter "nul" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

    # Maak zip met error handling
    try {
        Compress-Archive -Path $TempBackupDir -DestinationPath $ZipPath -CompressionLevel Optimal -ErrorAction Stop

        # Verwijder tijdelijke directory
        Remove-Item $TempBackupDir -Recurse -Force

        # Toon bestandsgrootte
        $ZipSize = (Get-Item $ZipPath).Length
        $ZipSizeMB = [math]::Round($ZipSize / 1MB, 2)

        Write-Host "[OK] ZIP aangemaakt: $ZipPath ($ZipSizeMB MB)" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] ZIP creatie gefaald: $_" -ForegroundColor Red
        Write-Host "[..] Backup directory blijft behouden: $TempBackupDir" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}
else {
    Write-Host "[OK] Backup directory: $TempBackupDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "[OK] Backup compleet!" -ForegroundColor Green
Write-Host ""

# Toon recente backups
Write-Host "Recente backups:" -ForegroundColor Cyan
$backups = Get-ChildItem $BackupDir -Filter "dharma-calendar_*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5

if ($backups) {
    foreach ($backup in $backups) {
        $Size = [math]::Round($backup.Length / 1MB, 2)
        Write-Host "   $($backup.Name) ($Size MB)"
    }
}
else {
    Write-Host "   (geen backups gevonden)"
}

Write-Host ""
