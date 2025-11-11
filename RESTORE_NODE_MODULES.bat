@echo off
echo ========================================
echo   ВОССТАНОВЛЕНИЕ NODE_MODULES
echo ========================================
echo.

echo Выберите действие:
echo 1. Восстановить client/node_modules
echo 2. Восстановить server/node_modules  
echo 3. Восстановить оба
echo 4. Переустановить через npm
echo.

set /p choice="Введите номер (1-4): "

if "%choice%"=="1" goto restore_client
if "%choice%"=="2" goto restore_server
if "%choice%"=="3" goto restore_both
if "%choice%"=="4" goto npm_install
goto end

:restore_client
echo Восстанавливаю client/node_modules...
cd client
if exist node_modules rmdir /s /q node_modules
xcopy /E /I /H /Y ..\node_modules_backup\client_node_modules node_modules
echo Готово!
goto end

:restore_server
echo Восстанавливаю server/node_modules...
cd server
if exist node_modules rmdir /s /q node_modules
xcopy /E /I /H /Y ..\node_modules_backup\server_node_modules node_modules
echo Готово!
goto end

:restore_both
echo Восстанавливаю client/node_modules...
cd client
if exist node_modules rmdir /s /q node_modules
xcopy /E /I /H /Y ..\node_modules_backup\client_node_modules node_modules
cd ..

echo Восстанавливаю server/node_modules...
cd server
if exist node_modules rmdir /s /q node_modules
xcopy /E /I /H /Y ..\node_modules_backup\server_node_modules node_modules
cd ..
echo Готово!
goto end

:npm_install
echo Переустанавливаю через npm...
echo.
echo Устанавливаю зависимости клиента...
cd client
call npm install
cd ..

echo Устанавливаю зависимости сервера...
cd server
call npm install
cd ..
echo Готово!
goto end

:end
echo.
echo Нажмите любую клавишу для выхода...
pause >nul