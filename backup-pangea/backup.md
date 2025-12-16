# Crear y bajar backup 

Este documento explica **cómo realizar backup y restore de una base de datos MongoDB en Linux**, específicamente en una instancia **AWS EC2 con Ubuntu 24.04**.

La configuración está pensada para **no usar carpetas con fechas**, sino una carpeta fija llamada `latest`, lo que simplifica el proceso y evita errores.

---

##  Requisitos

* Instancia EC2 con **Ubuntu 24.04**
* MongoDB instalado y en ejecución
* Acceso por terminal (SSH)
* Carpeta del proyecto: `pangea-backup`

---

## 1️. Instalar MongoDB Database Tools

En Linux **no se usan archivos `.bat` ni variables de entorno gráficas**.

Ejecuta en la terminal:

```bash
sudo apt update
sudo apt install -y mongodb-database-tools
```

Verifica la instalación:

```bash
mongodump --version
mongorestore --version
```

Si ambos comandos responden correctamente, la instalación fue exitosa.

---

## 2️. Estructura de carpetas

La estructura recomendada es la siguiente:

```bash
/home/ubuntu/pangea-backup/
├── backup.sh
├── restore.sh
└── backups/
    └── latest/
        └── pangea/
```

* `backup.sh` → crea el respaldo
* `restore.sh` → restaura la base de datos
* `latest` → siempre contiene el **último backup**
* `pangea` → nombre de la base de datos

---

## 3️. Script de Backup (`backup.sh`)

Este script:

* elimina el backup anterior
* crea uno nuevo
* siempre lo guarda en la carpeta `latest`

```bash
#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="/home/ubuntu/pangea-backup/backups/latest"

# Eliminar backup anterior
rm -rf "$BACKUP_DIR"

# Crear carpeta de backup
mkdir -p "$BACKUP_DIR"

# Ejecutar backup
mongodump --db "$DB_NAME" --out "$BACKUP_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Backup realizado correctamente en $BACKUP_DIR"
else
  echo "❌ Error al realizar el backup"
fi
```

---

## 4️. Script de Restore (`restore.sh`)

Este script:

* restaura la base de datos desde `latest`
* elimina las colecciones existentes antes de restaurar

```bash
#!/bin/bash

DB_NAME="pangea"
BACKUP_DIR="/home/ubuntu/pangea-backup/backups/latest"

mongorestore \
  --db "$DB_NAME" \
  --drop \
  "$BACKUP_DIR/$DB_NAME"

if [ $? -eq 0 ]; then
  echo "✅ Base de datos restaurada correctamente"
else
  echo "❌ Error al restaurar la base de datos"
fi
```

---

## 5️. Dar permisos de ejecución

Ejecutar **una sola vez**:

```bash
cd /home/ubuntu/pangea-backup
chmod +x backup.sh restore.sh
```

---

## 6️. Ejecutar Backup

Desde la carpeta `pangea-backup`:

```bash
./backup.sh
```

Resultado esperado:

```bash
✅ Backup realizado correctamente en /home/ubuntu/pangea-backup/backups/latest
```

---

## 7️. Ejecutar Restore

```bash
./restore.sh
```

Resultado esperado:

```bash
✅ Base de datos restaurada correctamente
```

---

## 8️. Verificación

1. Abrir **MongoDB Compass** desde el equipo local
2. Conectarse a la base de datos del servidor EC2
3. Verificar que las colecciones estén restauradas

---

## 🧠 Notas importantes

* No se utilizan carpetas con fechas
* No es necesario modificar rutas
* Siempre se trabaja con el último backup
* Ideal para automatización con `cron`
* Compatible con entornos de producción y académicos

