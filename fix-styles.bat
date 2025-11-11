@echo off
echo Исправляем стили...

cd client

echo Останавливаем сервер...
taskkill /f /im node.exe 2>nul

echo Очищаем кэш...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

echo Запускаем сервер...
start cmd /k "npm run dev"

echo Готово! Откройте http://localhost:5173 и нажмите Ctrl+Shift+R
pause