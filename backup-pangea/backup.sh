#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="/ola/pangea-backup/backups/latest"

# borrar backup anterior
rm -rf "$BACKUP_DIR"

# crear carpeta nueva
mkdir -p "$BACKUP_DIR"

# hacer backup
mongodump --db "$DB_NAME" --out "$BACKUP_DIR"

echo "Backup guardado en $BACKUP_DIR"