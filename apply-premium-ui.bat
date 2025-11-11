@echo off
echo 🎨 Применяем ПРЕМИУМ UX/UI дизайн...
echo.

cd client

echo 🧹 Очищаем кэш...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

echo 🔄 Перезапускаем сервер...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

start cmd /k "npm run dev"

echo.
echo ✨ ПРЕМИУМ ДИЗАЙН ПРИМЕНЕН!
echo.
echo 🎯 Что нового:
echo   • Единая система дизайна
echo   • Премиум цветовая палитра
echo   • Плавные микроанимации
echo   • Идеальная типографика
echo   • Гармоничные пропорции
echo   • Адаптивный дизайн
echo   • Темная тема
echo   • Accessibility
echo.
echo 🌟 Компоненты:
echo   • Кнопки: btn, btn-primary, btn-secondary
echo   • Карточки: card, card-elevated
echo   • Аватары: avatar, avatar-lg
echo   • Бейджи: badge, badge-error
echo   • Модальные окна с анимациями
echo   • Dropdown меню
echo   • Статус индикаторы
echo.
echo 📱 Откройте: http://localhost:5173
echo 🔄 Нажмите: Ctrl+Shift+R
echo.
echo 🎉 Наслаждайтесь премиум дизайном!
pause