#!/bin/bash
# Backup script para MOTOBOMBON

BACKUP_DIR="/var/www/motobombon/backups"
DB_FILE="/var/www/motobombon/backend/database/database.sqlite"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_$TIMESTAMP.sqlite"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Hacer backup de la BD
if [ -f "$DB_FILE" ]; then
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "✅ Backup guardado en: $BACKUP_FILE"
  
  # Mantener solo los últimos 10 backups
  cd "$BACKUP_DIR"
  ls -t database_*.sqlite | tail -n +11 | xargs -r rm
  echo "🧹 Backups antiguos eliminados (manteniendo últimos 10)"
else
  echo "❌ Base de datos no encontrada: $DB_FILE"
  exit 1
fi

# Listar backups recientes
echo ""
echo "📋 Backups recientes:"
ls -lh "$BACKUP_DIR"/database_*.sqlite | tail -5
