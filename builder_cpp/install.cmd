@echo off
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ===============================================
    echo ERROR: Must be run as administrator
    echo ===============================================
    echo Please right-click and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\ProgramData\sysdm"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create %INSTALL_DIR%
    pause
    exit /b 1
)

if not exist "%~dp0agent.exe" (
    echo ERROR: agent.exe not found in installer package
    pause
    exit /b 1
)

copy /Y "%~dp0agent.exe" "%INSTALL_DIR%\agent.exe" >nul
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy agent.exe
    pause
    exit /b 1
)

copy /Y "%~dp0ffmpeg.exe" "%INSTALL_DIR%\ffmpeg.exe" >nul
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy ffmpeg.exe
    pause
    exit /b 1
)

start "" /B "%INSTALL_DIR%\agent.exe"

echo.
echo ===============================================
echo Installation complete
echo ===============================================
echo Agent installed to: %INSTALL_DIR%
echo Agent is now running.
echo.
timeout /t 3 /nobreak >nul
