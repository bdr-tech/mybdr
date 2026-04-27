@echo off
REM ============================================================
REM  Daum Cafe session cookie daily refresh (ASCII-only for cmd)
REM ------------------------------------------------------------
REM  Manual run:    scripts\refresh-cafe-daily.bat --manual
REM                 (skips random-delay, keeps window on error)
REM  Scheduled run: random delay 0-30 min (anti-bot)
REM ============================================================

REM Force UTF-8 console so node.js Korean output renders correctly
chcp 65001 > nul 2>&1

setlocal ENABLEDELAYEDEXPANSION

REM --- Manual flag detection ---
set "MANUAL=0"
if /I "%~1"=="--manual" set "MANUAL=1"

REM --- Project root ---
set "PROJECT_DIR=%~dp0.."
pushd "%PROJECT_DIR%" || (
  echo [ERROR] Cannot cd to project dir: %PROJECT_DIR%
  if "%MANUAL%"=="1" pause
  exit /b 10
)

REM --- Log folder ---
set "LOG_DIR=%CD%\.auth\logs"
if not exist "%CD%\.auth" mkdir "%CD%\.auth"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM --- Timestamp via PowerShell (wmic-free, Win11 24H2 safe) ---
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"`) do set "STAMP=%%I"
if "%STAMP%"=="" set "STAMP=nostamp"
set "LOG_FILE=%LOG_DIR%\cafe-refresh-%STAMP%.log"

REM --- Header ---
echo ============================================================ > "%LOG_FILE%"
echo [%date% %time%] cafe cookie refresh start (manual=%MANUAL%)  >> "%LOG_FILE%"
echo project: %CD%                                                >> "%LOG_FILE%"
echo.                                                             >> "%LOG_FILE%"

REM --- Env probe ---
echo [ENV CHECK]       >> "%LOG_FILE%"
where node             >> "%LOG_FILE%" 2>&1
where npx              >> "%LOG_FILE%" 2>&1
node --version         >> "%LOG_FILE%" 2>&1
echo.                  >> "%LOG_FILE%"

echo [INFO] log: %LOG_FILE%
echo [INFO] running cafe-login.ts  -- do not close this window.

REM --- Delay: manual=0, scheduled=30min max random ---
if "%MANUAL%"=="1" (
  set "DELAY=0"
) else (
  set "DELAY=30"
)

echo [RUN] npx tsx scripts/cafe-login.ts --auto-wait --push-secret --random-delay=!DELAY! >> "%LOG_FILE%"
echo.  >> "%LOG_FILE%"

call npx.cmd tsx scripts/cafe-login.ts --auto-wait --push-secret --random-delay=!DELAY! >> "%LOG_FILE%" 2>&1
set "EXITCODE=!errorlevel!"

echo.                                       >> "%LOG_FILE%"
echo [%date% %time%] exit code: !EXITCODE!  >> "%LOG_FILE%"

popd

if !EXITCODE! neq 0 (
  echo [FAIL] exit !EXITCODE! -- see log: %LOG_FILE%
  REM Toast notification (BurntToast preferred, balloon fallback)
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { Import-Module BurntToast -ErrorAction Stop; New-BurntToastNotification -Text 'Cafe cookie refresh FAILED (code !EXITCODE!)','%LOG_FILE%' } catch { Add-Type -AssemblyName System.Windows.Forms; $n=New-Object System.Windows.Forms.NotifyIcon; $n.Icon=[System.Drawing.SystemIcons]::Warning; $n.BalloonTipTitle='Cafe cookie refresh FAILED'; $n.BalloonTipText='%LOG_FILE%'; $n.Visible=$true; $n.ShowBalloonTip(10000); Start-Sleep -Seconds 11 }"
  if "%MANUAL%"=="1" pause
  exit /b !EXITCODE!
)

echo [OK] done -- log: %LOG_FILE%
if "%MANUAL%"=="1" pause
exit /b 0
