#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="$HOME/ola/backup-pangea/backups/latest"

# Obtener credenciales de MongoDB desde variables de entorno o docker-compose
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-admin123}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"

# borrar backup anterior
rm -rf "$BACKUP_DIR"

# crear carpeta nueva
mkdir -p "$BACKUP_DIR"

echo "Iniciando backup de la base de datos $DB_NAME..."

# hacer backup con autenticación
mongodump \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_USER" \
  --password "$MONGO_PASS" \
  --authenticationDatabase admin \
  --db "$DB_NAME" \
  --out "$BACKUP_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Backup guardado exitosamente en $BACKUP_DIR"
  echo "📊 Tamaño del backup: $(du -sh $BACKUP_DIR | cut -f1)"
else
  echo "❌ Error al crear el backup"
  exit 1
fi
