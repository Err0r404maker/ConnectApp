@echo off
echo Перезапуск клиента...

REM Убиваем процессы на портах
taskkill /f /im node.exe 2>nul
netstat -ano | findstr :5173 > nul
if %errorlevel% == 0 (
    echo Порт 5173 занят, освобождаем...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a 2>nul
)

REM Переходим в папку клиента
cd /d "c:\Users\Miron\OneDrive\Рабочий стол\проект\client"

REM Очищаем кэш
echo Очистка кэша...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

REM Запускаем dev сервер
echo Запуск dev сервера...
npm run dev

pause