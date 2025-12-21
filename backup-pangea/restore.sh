#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="$HOME/ola/backup-pangea/backups/latest"

# Credenciales de MongoDB (deben coincidir con docker-compose.yml)
MONGO_USER="pangea"
MONGO_PASS="AdminArdilla"
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_AUTH_DB="admin"

echo "🔄 Iniciando restauración de la base de datos $DB_NAME..."
echo "📍 Conectando a $MONGO_HOST:$MONGO_PORT"
echo "⚠️  ADVERTENCIA: Esto eliminará todos los datos actuales de la base de datos"

# Confirmación
read -p "¿Desea continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Restauración cancelada"
    exit 1
fi

# Restaurar con autenticación
mongorestore \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_USER" \
  --password "$MONGO_PASS" \
  --authenticationDatabase "$MONGO_AUTH_DB" \
  --nsInclude="${DB_NAME}.*" \
  --drop \
  "$BACKUP_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Base de datos restaurada exitosamente"
else
  echo "❌ Error al restaurar la base de datos"
  exit 1
fi
