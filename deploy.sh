#!/bin/bash

# Script de deploy para MOTOBOMBON
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy de MOTOBOMBON..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/var/www/elite-studio"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# 1. Construir frontend
print_status "Construyendo frontend..."
cd Frontend
npm install
npm run build
print_status "Frontend construido exitosamente"

# 2. Subir backend
print_status "Preparando backend..."
cd ../backend

# Crear directorio de logs si no existe
mkdir -p logs

# Instalar dependencias
npm install --production

# Inicializar base de datos si no existe
if [ ! -f "database/database.sqlite" ]; then
    print_status "Inicializando base de datos..."
    npm run init
    npm run init-services
fi

print_status "Backend preparado"

# 3. Configurar PM2
print_status "Configurando PM2..."
cd ..

# Detener PM2 si está corriendo
pm2 stop elite-studio-backend 2>/dev/null || true
pm2 delete elite-studio-backend 2>/dev/null || true

# Iniciar con nueva configuración
pm2 start ecosystem.config.json

print_status "PM2 configurado y aplicación iniciada"

# 4. Reiniciar Nginx
print_status "Reiniciando Nginx..."
sudo systemctl reload nginx

print_status "🎉 Deploy completado exitosamente!"
print_status "La aplicación está disponible en tu dominio"

# Mostrar status
echo ""
echo "📊 Estado de la aplicación:"
pm2 status elite-studio-backend