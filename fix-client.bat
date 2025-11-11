@echo off
echo Исправление проблем клиента...

cd /d "c:\Users\Miron\OneDrive\Рабочий стол\проект\client"

echo 1. Остановка процессов...
taskkill /f /im node.exe 2>nul

echo 2. Очистка кэша Vite...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

echo 3. Переустановка зависимостей...
npm install

echo 4. Запуск dev сервера...
start "Client Dev Server" npm run dev

echo Клиент должен запуститься на http://localhost:5173
echo Если проблемы остались, проверьте консоль браузера
pause