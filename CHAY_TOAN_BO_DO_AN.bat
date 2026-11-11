@echo off
title KHOI DONG TOAN BO DO AN - FLORABOTANIC

echo =====================================================================
echo           HE THONG THUONG MAI VA NHAN DIEN CAY KIENG LA AI
echo                     KHOI DONG TOAN BO DO AN
echo =====================================================================
echo.
echo [*] Kiem tra va giai phong cong 8000 va 5173 neu co tien trinh cu...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [1/4] Dang khoi dong AI Service Backend tai cong 8000...
start "FloraBotanic AI Service (Port 8000)" cmd /k "cd /d E:\dowload\ai-service && C:\Users\doanxuanthinh\AppData\Local\Programs\Python\Python310\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/4] Dang khoi dong Cloudflare Tunnel cho App Android...
start "FloraBotanic Cloudflare Tunnel (Port 8000)" cmd /k "E:\CNTT\NLCNHTTT\04_Cong_Cu_Ho_Tro\cloudflared.exe tunnel --url http://localhost:8000"

echo [3/4] Dang khoi dong Web Frontend tai cong 5173...
start "FloraBotanic Frontend (Port 5173)" cmd /k "cd /d E:\CNTT\NLCNHTTT\frontend-kieng-la && npm run dev -- --host 0.0.0.0"

echo [4/4] Dang cho he thong san sang...
timeout /t 5 /nobreak > nul

start http://localhost:5173

echo.
echo =====================================================================
echo   DA KHOI DONG THANH CONG!
echo   - Web Frontend: http://localhost:5173
echo   - Backend API:  http://localhost:8000
echo   - Swagger Docs: http://localhost:8000/docs
echo.
echo   Luu y: Giu nguyen 2 cua so CMD dang chay de he thong hoat dong.
echo =====================================================================
pause
