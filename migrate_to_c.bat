@echo off
echo D: diskidagi fayllar C: diskka ko'chirilmoqda...
robocopy "D:\Asfalt zavod sayt" "C:\AsfaltZavod" /S /XD node_modules dist .git
echo.
echo Ko'chirish yakunlandi! Endi VS Code dasturida C:\AsfaltZavod papkasini oching.
echo Ochganingizdan so'ng terminalda quyidagilarni yozing:
echo 1) npm install
echo 2) npx prisma generate
echo 3) npx prisma db push
echo 4) npm run dev
pause
