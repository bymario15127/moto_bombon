#!/bin/bash
# Script para actualizar el sistema de fidelización en el VPS
# Uso: ./update-fidelizacion.sh

set -e

echo "🎁 Actualizando Sistema de Fidelización MOTOBOMBON..."
echo "================================================"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Variables
APP_DIR="/var/www/motobombon"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/Frontend"

# Validar directorio
[ ! -d "$APP_DIR" ] && log_error "Directorio $APP_DIR no encontrado"

cd "$APP_DIR"
log_info "Directorio: $APP_DIR"

# 1. Hacer backup de la base de datos
echo ""
echo "💾 Haciendo backup de base de datos..."
if [ -f "$BACKEND_DIR/database/database.sqlite" ]; then
    cp "$BACKEND_DIR/database/database.sqlite" "$BACKEND_DIR/database/database.sqlite.backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Backup creado"
else
    log_warn "No hay base de datos para respaldar"
fi

# 2. Actualizar código desde GitHub
echo ""
echo "📦 Actualizando código..."
git stash 2>/dev/null || true
git pull origin main || log_error "Error al hacer pull"
log_info "Código actualizado"

# 3. Instalar nuevas dependencias del backend (nodemailer, dotenv)
echo ""
echo "📦 Instalando nuevas dependencias..."
cd "$BACKEND_DIR"
npm install nodemailer dotenv --save || log_error "Error instalando dependencias"
log_info "Nodemailer y dotenv instalados"

# 4. Ejecutar migraciones de base de datos
echo ""
echo "🗄️  Ejecutando migraciones..."
node database/initClientes.js || log_warn "Error en initClientes (puede ya existir)"
node database/addTotalLavadas.js || log_warn "Error en addTotalLavadas (puede ya existir)"
log_info "Migraciones ejecutadas"

# 5. Verificar/crear archivo .env
echo ""
echo "⚙️  Verificando configuración .env..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log_warn "Archivo .env no encontrado"
    echo "Creando .env de ejemplo..."
    cat > "$BACKEND_DIR/.env" << 'EOF'
# Configuración de producción
NODE_ENV=production
PORT=3000

# CORS
CORS_ORIGINS=https://tudominio.com

# Email (CONFIGURAR MANUALMENTE)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion

# Logs
LOG_LEVEL=info
EOF
    log_warn "⚠️  IMPORTANTE: Debes configurar las credenciales SMTP en $BACKEND_DIR/.env"
    log_warn "⚠️  Ver: https://myaccount.google.com/apppasswords para Gmail"
else
    log_info ".env ya existe"
    # Verificar si tiene las nuevas variables SMTP
    if ! grep -q "SMTP_HOST" "$BACKEND_DIR/.env"; then
        log_warn "Agregando variables SMTP al .env..."
        cat >> "$BACKEND_DIR/.env" << 'EOF'

# Sistema de Fidelización - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
EOF
        log_warn "⚠️  IMPORTANTE: Configura SMTP_USER y SMTP_PASS en $BACKEND_DIR/.env"
    fi
fi

# 6. Build del frontend
echo ""
echo "🏗️  Compilando frontend..."
cd "$FRONTEND_DIR"
npm install || log_error "Error instalando dependencias frontend"
npm run build || log_error "Error en build"
log_info "Frontend compilado"

# 7. Reiniciar backend con PM2
echo ""
echo "🔄 Reiniciando servicios..."
cd "$APP_DIR"

# Reiniciar PM2
pm2 restart motobombon-backend || {
    log_warn "No se pudo reiniciar, intentando iniciar..."
    pm2 start ecosystem.config.json
}
pm2 save
log_info "Backend reiniciado"

# 8. Reiniciar Nginx
echo ""
echo "🔄 Reiniciando Nginx..."
sudo nginx -t || log_error "Configuración Nginx inválida"
sudo systemctl reload nginx
log_info "Nginx reiniciado"

# 9. Verificar estado
echo ""
echo "🔍 Verificando servicios..."
pm2 status
echo ""

# Resumen
echo ""
echo "================================================"
echo -e "${GREEN}✅ ACTUALIZACIÓN COMPLETADA${NC}"
echo "================================================"
echo ""
echo "📋 Pasos adicionales necesarios:"
echo ""
echo "1. Configurar credenciales SMTP en:"
echo "   $BACKEND_DIR/.env"
echo ""
echo "2. Para Gmail, genera contraseña de aplicación:"
echo "   https://myaccount.google.com/apppasswords"
echo ""
echo "3. Después de configurar SMTP, reinicia:"
echo "   pm2 restart motobombon-backend"
echo ""
echo "4. Verifica logs:"
echo "   pm2 logs motobombon-backend"
echo ""
echo "📚 Documentación del sistema:"
echo "   $APP_DIR/SISTEMA-FIDELIZACION.md"
echo ""
echo "🎁 El sistema de fidelización está listo!"
echo "   - 10 lavadas = 1 cupón gratis automático"
echo "   - Contador se reinicia cada 10 lavadas"
echo "   - Nueva sección 'Clientes' en el admin"
echo ""
