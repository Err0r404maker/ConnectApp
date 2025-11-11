@echo off
echo ========================================
echo   ПРИМЕНЕНИЕ СОВРЕМЕННОГО UI ДИЗАЙНА
echo ========================================
echo.

echo [1/3] Очистка кэша Vite...
cd client
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Кэш Vite очищен
) else (
    echo ✓ Кэш уже чист
)
echo.

echo [2/3] Очистка dist...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist очищен
) else (
    echo ✓ Dist уже чист
)
echo.

echo [3/3] Запуск dev сервера...
echo.
echo ========================================
echo   СЕРВЕР ЗАПУСКАЕТСЯ...
echo ========================================
echo.
echo Откройте браузер и нажмите Ctrl+Shift+R
echo для жесткой перезагрузки страницы
echo.
echo Если стили не применились:
echo 1. Закройте все вкладки с приложением
echo 2. Откройте в режиме инкогнито
echo 3. Нажмите F12 и проверьте консоль
echo.
echo ========================================
echo.

npm run dev
