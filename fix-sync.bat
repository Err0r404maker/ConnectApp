@echo off
echo ========================================
echo   FIXING SYNC ISSUES
echo ========================================
echo.

echo [1/3] Applying database schema updates...
node apply-schema-updates.js
echo.

echo [2/3] Restarting server...
echo Please restart server manually: cd server ^&^& npm run dev
echo.

echo [3/3] Clear browser cache and reload
echo Press Ctrl+Shift+R in browser to hard reload
echo.

echo ========================================
echo   DONE! Now restart the server
echo ========================================
pause
