# Cómo Ejecutar los Tests E2E Correctamente

## Requisitos Previos

Antes de ejecutar los tests E2E, asegúrate de que todos los servicios estén corriendo:

### 1. Base de Datos MongoDB
```powershell
# Verificar que MongoDB esté corriendo
mongod --version

# Si no está corriendo, iniciar MongoDB
# En Windows con MongoDB instalado como servicio:
net start MongoDB
```

### 2. Backend (API)
```powershell
# Terminal 1: Iniciar el backend
cd backend
npm install  # Solo la primera vez
npm start

# El backend debería estar corriendo en http://localhost:5000
# Esperar a ver el mensaje: "Servidor corriendo en puerto 5000"
```

### 3. Frontend (React)
```powershell
# Terminal 2: Iniciar el frontend
cd frontend
npm install  # Solo la primera vez
npm start

# El frontend debería estar corriendo en http://localhost:3000
# Esperar a que se abra el navegador automáticamente
```

### 4. Verificar que Todo Funciona
Antes de correr los tests, abre manualmente en tu navegador:
- http://localhost:3000 - Debería mostrar la página de login
- http://localhost:5000/api/health - Debería responder con status OK

## Ejecutar los Tests

Una vez que backend y frontend estén corriendo:

```powershell
# Terminal 3: Ejecutar los tests
npx playwright test "e2e/PedidosEntregados.spec.ts" --reporter=list

# O ejecutar todos los tests:
npx playwright test --reporter=list

# O ejecutar un test específico:
npx playwright test "e2e/PedidosEntregados.spec.ts" -g "Abrir modal Nueva Remisión" --reporter=list
```

## Solución de Problemas

### Error: "element(s) not found" o "Test timeout"
**Causa**: El backend o frontend no están corriendo correctamente.

**Solución**:
1. Verifica que el backend esté corriendo: http://localhost:5000
2. Verifica que el frontend esté corriendo: http://localhost:3000
3. Revisa los logs del backend y frontend en sus respectivas terminales
4. Asegúrate de que MongoDB esté corriendo

### Error: "Connection refused"
**Causa**: MongoDB no está corriendo o el backend no puede conectarse.

**Solución**:
```powershell
# Verificar MongoDB
mongo --eval "db.version()"

# Si falla, iniciar MongoDB
net start MongoDB
```

### Los tests pasan pero muestran "No table found - skipping test"
**Causa**: La base de datos está vacía o no tiene datos de prueba.

**Solución**:
1. Crear datos de prueba manualmente a través de la UI
2. O ejecutar el seed script:
```powershell
cd backend
node scripts/seed.js
```

## Datos Necesarios para los Tests

Para que todos los tests pasen, la base de datos debe tener:

1. **Usuario admin**: usuario='admin', contraseña='admin123'
2. **Remisiones entregadas**: Al menos una remisión en estado entregado
3. **Clientes**: Al menos un cliente con datos completos
4. **Productos**: Al menos un producto con stock disponible

## Estructura Recomendada de Ejecución

```powershell
# Paso 1: Abrir PowerShell y dividir en 3 ventanas
# Ventana 1 - Backend:
cd C:\Users\USER\Desktop\ola\backend
npm start

# Ventana 2 - Frontend:
cd C:\Users\USER\Desktop\ola
npm start

# Ventana 3 - Tests (esperar a que backend y frontend estén listos):
cd C:\Users\USER\Desktop\ola
npx playwright test --reporter=list
```

## Notas Importantes

- **NO ejecutar los tests sin tener backend y frontend corriendo**
- Los tests E2E requieren que la aplicación esté completamente funcional
- Si un servicio falla, todos los tests relacionados fallarán
- Revisar siempre los logs del backend/frontend si los tests fallan
