@echo off
echo === Kod sinxronlanmoqda ===
xcopy /Y /E /I "D:\Asfalt zavod sayt\src" "C:\AsfaltZavod\src\" >nul 2>&1
xcopy /Y "D:\Asfalt zavod sayt\server\index.ts" "C:\AsfaltZavod\server\" >nul 2>&1
echo === Backend ishga tushmoqda ===
start "Backend" cmd /k "cd /d C:\AsfaltZavod && node --experimental-strip-types server/index.ts"
timeout /t 2 /nobreak >nul
echo === Frontend ishga tushmoqda ===
start "Frontend" cmd /k "cd /d C:\AsfaltZavod && node node_modules\vite\bin\vite.js"
timeout /t 5 /nobreak >nul
start http://localhost:5173
