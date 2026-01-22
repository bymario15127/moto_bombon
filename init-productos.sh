#!/bin/bash
# Script para inicializar productos en Linux/Mac

cd "$(dirname "$0")"

echo ""
echo "===================================="
echo "Inicializando módulo de Productos"
echo "===================================="
echo ""

cd backend

echo "📦 Ejecutando inicialización de productos..."
node database/initProductos.js

if [ $? -eq 0 ]; then
    echo ""
    echo "===================================="
    echo "✅ ¡Inicialización completada!"
    echo "===================================="
    echo ""
    echo "Próximos pasos:"
    echo "1. Inicia el servidor: npm run dev"
    echo "2. Abre: http://localhost:5173"
    echo "3. Ingresa como Admin/Supervisor"
    echo "4. Ve a: 📦 Productos"
else
    echo ""
    echo "❌ Error en la inicialización"
    exit 1
fi
