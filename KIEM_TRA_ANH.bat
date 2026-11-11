@echo off
chcp 65001 >nul
title KIEM TRA DO CHINH XAC ANH - KIENGLA AI
color 0A

echo =================================================================
echo        KIEM TRA DO CHINH XAC NHAN DIEN CAY (KIENGLA AI)
echo =================================================================
echo.

set "IMG_PATH=%~1"

if "%IMG_PATH%"=="" (
    set /p "IMG_PATH=Nhap duong dan file anh (hoac keo tha file anh vao day): "
)

if "%IMG_PATH%"=="" (
    set "IMG_PATH=E:\CNTT\NLCNHTTT\frontend-kieng-la\public\plants\51.jpg"
)

"C:\Users\doanxuanthinh\AppData\Local\Programs\Python\Python310\python.exe" "E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\kiem_tra_anh_bat_ky.py" "%IMG_PATH%"

echo.
pause
