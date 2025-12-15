#!/bin/bash
# Script para actualizar el VPS con el sistema de promociones

echo "🚀 Actualizando MOTOBOMBON en VPS con sistema de promociones..."
echo ""

# 1. Ir al directorio del proyecto
cd /var/www/motobombon || exit

# 2. Hacer backup de la base de datos
echo "📦 Creando backup de la base de datos..."
cp backend/database/database.sqlite backend/database/database.sqlite.backup-$(date +%Y%m%d-%H%M%S)

# 3. Pull de los cambios
echo "📥 Descargando cambios desde GitHub..."
git pull origin main

# 4. Instalar dependencias (por si acaso)
echo "📦 Verificando dependencias..."
cd backend
npm install
cd ..

# 5. Crear tabla de promociones
echo "🗄️ Creando tabla de promociones..."
cd backend
node database/createPromociones.js

# 6. Actualizar citas existentes de GOLD NAVIDEÑO
echo "🔄 Actualizando citas de GOLD NAVIDEÑO existentes..."
node database/updateGoldNavidenoExistentes.js

# 7. Reiniciar backend con PM2
echo "🔄 Reiniciando backend..."
cd ..
pm2 restart backend

# 8. Build del frontend (si es necesario)
echo "🏗️ Construyendo frontend..."
cd Frontend
npm install
npm run build

# 9. Verificar que todo está corriendo
echo ""
echo "✅ Actualización completada!"
echo ""
echo "📊 Verificando servicios:"
pm2 list

echo ""
echo "🎉 Sistema de promociones instalado exitosamente!"
echo ""
echo "📝 Ahora puedes:"
echo "   - Ver promociones: GET /api/promociones"
echo "   - Las citas de GOLD NAVIDEÑO ahora usan el precio_comision correcto"
echo "   - Cliente paga: $25,000 / $28,000"
echo "   - Lavador comisión sobre: $45,000"
echo ""
