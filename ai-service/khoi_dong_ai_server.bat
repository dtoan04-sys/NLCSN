@echo off
title FloraBotanic - AI Service Backend Port 8000
cd /d "E:\dowload\ai-service"

echo ========================================================
echo       HE THONG AI NHAN DIEN VA BAN CAY KIENG LA
echo                   AI SERVICE BACKEND
echo ========================================================
echo.
echo [*] Kiem tra va giai phong cong 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [*] Dia chi Backend: http://localhost:8000
echo [*] Tai lieu API:    http://localhost:8000/docs
echo.
echo Dang khoi dong uvicorn va nap model MobileNetV2...
echo --------------------------------------------------------

"C:\Users\doanxuanthinh\AppData\Local\Programs\Python\Python310\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

if %errorlevel% neq 0 (
    echo.
    echo [!] Thu khoi dong bang python trong PATH...
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)

pause
