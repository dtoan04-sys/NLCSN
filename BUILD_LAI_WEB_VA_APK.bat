@echo off
title BUILD LAI WEB VA ANDROID APK - KIENG LA AI
echo =====================================================================
echo         DONG GOI LAI GIAO DIEN WEB VA FILE CAI DAT ANDROID APK
echo =====================================================================
echo.

cd /d "E:\CNTT\NLCNHTTT\frontend-kieng-la"

echo [1/4] Dang build giao dien Web (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [!] Loi khi build Web!
    pause
    exit /b 1
)

echo [2/4] Dang dong bo sang du an Capacitor Android...
call npx cap sync android

echo [3/4] Dang bien dich file Android APK (Gradle)...
call "E:\CNTT\NLCNHTTT\frontend-kieng-la\android\build_apk.bat"
if %errorlevel% neq 0 (
    echo [!] Loi khi bien dich APK!
    pause
    exit /b 1
)

echo [4/4] Dang chep file APK moi nhat vao thu muc 03_Ung_Dung_Android_APK...
copy /Y "E:\CNTT\NLCNHTTT\frontend-kieng-la\android\app\build\outputs\apk\debug\app-debug.apk" "E:\CNTT\NLCNHTTT\03_Ung_Dung_Android_APK\KiengLaAI_app-debug.apk"

echo.
echo =====================================================================
echo   HOAN TAT! File APK moi nhat nam tai:
echo   E:\CNTT\NLCNHTTT\03_Ung_Dung_Android_APK\KiengLaAI_app-debug.apk
echo =====================================================================
pause
