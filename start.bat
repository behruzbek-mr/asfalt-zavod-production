@echo off
echo === Backend ishga tushmoqda ===
start "Backend" cmd /k "cd /d "d:\Asfalt zavod sayt" && node --experimental-strip-types server/index.ts"
timeout /t 2 /nobreak >nul
echo === Frontend ishga tushmoqda ===
start "Frontend" cmd /k "cd /d "d:\Asfalt zavod sayt" && node node_modules\vite\bin\vite.js"
timeout /t 5 /nobreak >nul
start http://localhost:5173
