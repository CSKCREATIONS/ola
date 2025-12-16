#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="/ola/pangea-backup/backups/latest"

mongorestore \
  --db "$DB_NAME" \
  --drop \
  "$BACKUP_DIR/$DB_NAME"

echo "Base de datos restaurada"