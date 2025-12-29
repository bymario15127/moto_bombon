@echo off
echo Inicializando base de datos...
node database\init.js
echo.
echo Inicializando servicios...
node database\initServicios.js
echo.
echo Base de datos creada correctamente!
pause
