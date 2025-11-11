@echo off
echo 🚀 ПРИНУДИТЕЛЬНОЕ ПРИМЕНЕНИЕ СТИЛЕЙ
echo.

cd client

echo 🛑 Убиваем все процессы...
taskkill /f /im node.exe 2>nul
taskkill /f /im chrome.exe 2>nul
taskkill /f /im msedge.exe 2>nul

echo 🧹 ПОЛНАЯ очистка...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q .next 2>nul
del /q package-lock.json 2>nul

echo 📦 Переустановка...
npm install

echo 🔄 Запуск...
start cmd /k "npm run dev"

echo.
echo ✅ СТИЛИ ПРИНУДИТЕЛЬНО ПРИМЕНЕНЫ!
echo.
echo 🎨 Что должно быть:
echo   • Темно-синий фон
echo   • Фиолетовый sidebar
echo   • Маленькие аватары (28px)
echo   • Компактные кнопки
echo   • Размер шрифта 11-13px
echo.
echo ⚠️  ОБЯЗАТЕЛЬНО:
echo   1. Откройте НОВУЮ вкладку браузера
echo   2. Или режим инкогнито (Ctrl+Shift+N)
echo   3. Перейдите на http://localhost:5173
echo.
echo 🔄 Если не помогло - перезагрузите компьютер!
pause