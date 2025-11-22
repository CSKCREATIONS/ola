#!/bin/bash
# Restore mongodump-formatted dumps if present
# This script runs inside the official mongo image at container init time.
# It expects a directory `/docker-entrypoint-initdb.d/dump` containing a mongodump output
# (folder structure with dbname/*.bson and metadata.json), or a dumped DB folder.

set -e

TARGET_DB=${MONGO_INITDB_DATABASE:-pangea}
DUMP_DIR="/docker-entrypoint-initdb.d/dump"

echo "[mongo-init] checking for dump in ${DUMP_DIR}..."

if [ -d "${DUMP_DIR}" ] && [ "$(ls -A ${DUMP_DIR})" ]; then
  echo "[mongo-init] found dump, attempting mongorestore to database '${TARGET_DB}'"

  # If the dump contains a top-level folder named after the DB, restore that; otherwise restore everything
  if [ -d "${DUMP_DIR}/${TARGET_DB}" ]; then
    echo "[mongo-init] restoring only ${TARGET_DB} from ${DUMP_DIR}/${TARGET_DB}"
    mongorestore --db ${TARGET_DB} --drop "${DUMP_DIR}/${TARGET_DB}"
  else
    echo "[mongo-init] restoring entire dump directory: ${DUMP_DIR}"
    # restore will auto-detect db namespaces in the dump directory
    mongorestore --drop "${DUMP_DIR}"
  fi

  echo "[mongo-init] mongorestore completed"
else
  echo "[mongo-init] no dump found at ${DUMP_DIR} — skipping mongorestore"
fi

exit 0
