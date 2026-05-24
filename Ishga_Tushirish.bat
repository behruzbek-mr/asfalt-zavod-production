@echo off
title Asfalt Zavod ERP Tizimi
echo Tizim ishga tushirilmoqda...
cd /d C:\AsfaltZavod

:: Oldingi ochiq qolgan jarayonlarni tozalash
taskkill /f /im node.exe >nul 2>&1

:: Orqa fonda backend serverni ishga tushirish
start "Asfalt Backend" /min cmd /c "npm run dev:backend"

:: Orqa fonda frontend serverni Wi-Fi tarmog'i uchun ochib ishga tushirish
start "Asfalt Frontend" /min cmd /c "npm run dev:frontend -- --host"

echo --------------------------------------------------
echo        TIZIM MUVAFFQQIYATLI ISHGA TUSHDI!
echo --------------------------------------------------
echo.
echo 💻 Ushbu kompyuterdan kirish:
echo   http://localhost:5173
echo.
echo 📱 Telefon va boshqa noutbuklardan (Wi-Fi orqali) kirish:
echo   http://192.168.3.104:5173
echo.
echo --------------------------------------------------
echo Eslatma: Ushbu qora oynani yopmang! U yopilsa tizim o'chadi.
echo --------------------------------------------------

timeout /t 3 >nul
start http://localhost:5173
