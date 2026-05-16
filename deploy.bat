@echo off
echo =====================================
echo   ASFALT ERP - YANGILASH SKRIPTI
echo =====================================
echo.

echo [1/3] Fayllar C:\AsfaltProject ga ko'chirilmoqda...
node "d:\Asfalt zavod sayt\copy_to_c.cjs"
if errorlevel 1 (
    echo XATO: Nusxalash muvaffaqiyatsiz!
    pause
    exit /b 1
)
echo OK - Fayllar ko'chirildi
echo.

echo [2/3] GitHub ga yuborilmoqda...
cd /d C:\AsfaltProject
git add -A
git commit -m "yangilash - %date% %time%"
git push origin main
if errorlevel 1 (
    echo XATO: GitHub ga yuborib bo'lmadi!
    pause
    exit /b 1
)
echo OK - GitHub ga yuborildi
echo.

echo [3/3] Render avtomatik deploy boshlaydi...
echo.
echo =====================================
echo   MUVAFFAQIYATLI! 
echo   3-5 daqiqadan so'ng sayt yangilanadi
echo   https://asfalt-zavodasfalt-zavod.onrender.com
echo =====================================
echo.
pause
