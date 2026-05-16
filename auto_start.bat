@echo off
echo Loyihani qutqarish boshlandi: C: diskka ko'chirilmoqda...
robocopy "D:\Asfalt zavod sayt" "C:\AsfaltZavod" /S /XD node_modules node_modules_bad dist .git /R:0 /W:0

echo.
echo C: diskka o'tilmoqda va kutubxonalar o'rnatilmoqda (bu biroz vaqt olishi mumkin)...
cd /d "C:\AsfaltZavod"
call npm install

echo.
echo Baza tayyorlanmoqda...
call npx prisma generate
call npx prisma db push --accept-data-loss

echo.
echo Dastur ishga tushirilmoqda...
call npm run dev
