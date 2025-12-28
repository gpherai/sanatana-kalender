@echo off
REM Dharma Calendar - Quick Backup
REM Voer dit uit vanuit de project directory

powershell -ExecutionPolicy Bypass -File "%~dp0backup.ps1" %*
