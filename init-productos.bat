@echo off
REM Script para ejecutar todas las inicializaciones de la base de datos

cd backend

echo.
echo ====================================
echo Inicializando tablas de productos y ventas...
echo ====================================
node database/initProductos.js

echo.
echo ====================================
echo ¡Inicializacion completada!
echo ====================================
pause
