#!/bin/bash
# Backup completo de MOTOBOMBON (proyecto + BD)

BACKUP_DIR="/var/www/motobombon/backups"
PROJECT_DIR="/var/www/motobombon"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/motobombon_full_$TIMESTAMP.tar.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup completo de MOTOBOMBON..."
echo "📁 Proyecto: $PROJECT_DIR"
echo "💾 Archivo: $BACKUP_FILE"
echo ""

# Hacer backup comprimido (excluyendo node_modules, .git y logs grandes)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs/*.log' \
    --exclude='*.log' \
    --exclude='.env' \
    -czf "$BACKUP_FILE" \
    -C /var/www \
    motobombon

if [ $? -eq 0 ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup completado exitosamente"
  echo "📦 Tamaño: $SIZE"
  echo "📍 Ubicación: $BACKUP_FILE"
  
  # Mantener solo los últimos 5 backups completos
  echo ""
  echo "🧹 Limpiando backups antiguos..."
  cd "$BACKUP_DIR"
  ls -t motobombon_full_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
  
  echo ""
  echo "📋 Backups recientes:"
  ls -lh "$BACKUP_DIR"/motobombon_full_*.tar.gz 2>/dev/null | tail -5
else
  echo "❌ Error al crear el backup"
  exit 1
fi

# Mostrar espacio disponible
echo ""
echo "💾 Espacio en /var/www:"
df -h /var/www | tail -1
