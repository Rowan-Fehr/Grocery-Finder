@echo off
cd /d "%~dp0"
where python >nul 2>nul || (echo Python is not installed. & pause & exit /b)
echo Starting... keep this window open while you use the demo.
python -m pip install --quiet pillow
start "" cmd /c "timeout /t 3 >nul & start http://localhost:8000"
powershell -NoProfile -Command "python -u demo_server.py 2>&1 | Tee-Object -FilePath demo_log.txt"
echo.
echo The demo stopped. Read the lines above, then press any key.
pause
