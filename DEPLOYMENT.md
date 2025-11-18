# Guía de Despliegue - Pangea

## Cambios Realizados

### 1. Corrección de Rutas API Duplicadas
- **Problema**: El frontend llamaba `/api/api/auth/signin` en lugar de `/api/auth/signin`
- **Solución**: 
  - Eliminada la variable `REACT_APP_API_URL` de docker-compose
  - Actualizado `axiosConfig.js` para usar el mismo hostname que el navegador
  - Agregado nginx.conf en el frontend para proxy de `/api/*` → `backend:5000`

### 2. Configuración de Nginx en Frontend
- Nuevo archivo `frontend/nginx.conf` que:
  - Sirve archivos estáticos de React
  - Hace proxy de `/api/*` al backend:5000
  - Maneja rutas de React (SPA) con `try_files`

### 3. CORS Actualizado
- Backend ahora acepta requests desde:
  - http://localhost
  - http://localhost:3000
  - http://pangea.casacam.net
  - https://pangea.casacam.net

## Instrucciones de Despliegue en VM

### Paso 1: Actualizar código en VM
```bash
cd ~/ola
git pull origin main
```

### Paso 2: Detener contenedores actuales
```bash
docker compose down
```

### Paso 3: Limpiar imágenes antiguas
```bash
docker rmi cskcreations/pangea-frontend:latest
docker rmi cskcreations/pangea-backend:latest
```

### Paso 4: Reconstruir sin caché
```bash
docker compose build --no-cache
```

### Paso 5: Levantar servicios
```bash
docker compose up -d
```

### Paso 6: Verificar que los 3 servicios estén corriendo
```bash
docker compose ps
```
Deberías ver:
- pangea-mongo (Up)
- pangea-backend (Up, healthy)
- pangea-frontend (Up)

### Paso 7: Probar conectividad
```bash
# Probar frontend
curl -I http://localhost:3000/

# Probar backend (a través del proxy del frontend)
curl http://localhost:3000/api/health

# Probar backend directo
curl http://localhost:5000/api/health
```

### Paso 8: Revisar logs si hay errores
```bash
docker compose logs -f frontend --tail=100
docker compose logs -f backend --tail=100
```

## Configuración de Nginx Proxy Manager

### Opción A: Proxy Todo al Frontend (RECOMENDADO)
El nginx del frontend ya maneja el proxy a backend internamente.

**Configuración en Nginx Proxy Manager:**
- Domain: `pangea.casacam.net`
- Scheme: `http`
- Forward Hostname/IP: `172.31.16.208` (IP interna de la VM)
- Forward Port: `3000`
- Cache Assets: ✓
- Block Common Exploits: ✓
- Websockets Support: ✓

### Opción B: Dos Proxies Separados
Si prefieres separar frontend y backend:

**Frontend:**
- Domain: `pangea.casacam.net`
- Forward to: `172.31.16.208:3000`

**Backend:**
- Location: `/api/`
- Forward to: `http://172.31.16.208:5000`
- Custom config:
  ```nginx
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  ```

## Crear Usuario Admin

Una vez que todo funcione:
```bash
cd ~/ola
docker compose run --rm backend node scripts/seed.js
```

Esto creará:
- Usuario: `admin`
- Contraseña: `Admin123!`

## Verificación Final

1. Abrir https://pangea.casacam.net
2. Ver login page sin errores 502
3. Intentar login con admin/Admin123!
4. Verificar que no hay errores `/api/api/...` en consola

## Solución de Problemas

### Si sigue apareciendo 502:
```bash
# Verificar que los 3 contenedores estén corriendo
docker compose ps

# Ver logs del frontend
docker compose logs frontend --tail=200

# Ver logs del backend
docker compose logs backend --tail=200

# Verificar conectividad interna
docker compose exec frontend wget -O- http://backend:5000/api/health
```

### Si aparece CORS error:
- Verificar que `CORS_ORIGINS` en docker-compose.yml incluya el dominio correcto
- Reconstruir backend: `docker compose build backend && docker compose up -d backend`

### Si aparece "Cannot connect to backend":
- Verificar que el nginx.conf se copió correctamente:
  ```bash
  docker compose exec frontend cat /etc/nginx/conf.d/default.conf
  ```
- Debe contener `location /api/` con `proxy_pass http://backend:5000;`
