# Modelo de Calidad del Proyecto

Este documento define el modelo de calidad para el sistema (backend Node.js/Express + MongoDB y frontend React), estableciendo expectativas, criterios de aceptación, métricas medibles, procesos, prácticas y responsabilidades necesarias para asegurar que el software cumpla consistentemente con los requisitos funcionales y no funcionales.


## 1. Contexto y alcance

### Arquitectura
- **Backend**: Node.js (Express), MongoDB/Mongoose, autenticación JWT, permisos basados en roles
- **Frontend**: React, axios centralizado, almacenamiento de tokens en localStorage
- **API REST** bajo prefijo `/api/*`

### Entornos
Desarrollo, pruebas (staging) y producción

### Usuarios principales
Administradores, vendedores, compradores, logística y perfiles de consulta

### Datos sensibles
Usuarios, clientes, ventas, compras, productos, documentos comerciales (cotizaciones, remisiones, órdenes de compra)


## 2. Atributos de calidad (ISO/IEC 25010) y metas medibles

### 2.1. Disponibilidad y confiabilidad
**Objetivo**: Garantizar operación estable del sistema

**SLI**: Disponibilidad mensual, tasa de errores 5xx, MTTR

**SLO**:
- Disponibilidad ≥ 99.5%
- Errores 5xx ≤ 1% del total de solicitudes
- MTTR ≤ 30 minutos

**Verificación**: Monitoreo, pruebas de resiliencia, simulación de fallos

### 2.2. Rendimiento y eficiencia
**SLI**: Latencia p95 por endpoint, throughput, uso de CPU/memoria

**SLO**:
- p95 ≤ 400 ms en CRUD
- p95 ≤ 1200 ms en generación de documentos (PDF, Excel)
- LCP frontend ≤ 2.5 s para vistas principales

**Verificación**: k6/wrk, Lighthouse, profiling

### 2.3. Seguridad
**Controles vigentes**:
- Autenticación JWT; contraseñas con bcrypt (salt 10)
- Autorización por rol mediante middlewares (`authJwt.js`, `role.js`)
- Transporte HTTPS en producción; CORS restringido
- Sanitización: express-validator, mongo-sanitize, sanitize-html
- Cabeceras de seguridad: Helmet
- Rate-limiting configurado
- Gestión de secretos con dotenv
- Validación robusta de email y entradas

**SonarQube Cloud**:
- Quality Gate: **Passed**
- Security Rating: **A** (0 issues)
- Proyecto: CSKCREATIONS/ola en rama main
- Análisis continuo integrado con GitHub

**Verificación**: npm audit y Snyk/Dependabot

### 2.4. Mantenibilidad
**Métricas SonarQube Cloud**:
- **56k líneas** analizadas
- **Maintainability Rating: A** (8 issues abiertos)
- **Reliability Rating: A** (4 issues abiertos)
- **Duplicación: 3%**
- **Cobertura: 3%** (requiere configuración adicional)

**Buenas prácticas**:
- ESLint configurado
- Separación por capas (controllers, services, models, routes)
- Documentación completa (README, TESTS_README, DEPLOYMENT, PERMISOS_SISTEMA)

**Verificación**: SonarQube Cloud en cada análisis; revisiones de PR

### 2.5. Usabilidad y accesibilidad
**Metas**:
- WCAG 2.1 AA en páginas principales
- Mensajes claros en errores 401/403
- Navegación por teclado y labels en formularios

**Verificación**: Lighthouse Accessibility ≥ 90

### 2.6. Compatibilidad y portabilidad
**Implementación**:
- Modelo **12-Factor** en backend y frontend
- Variables de entorno: MONGODB_URI, JWT_SECRET, PORT, NODE_ENV, CORS origins, SendGrid API key
- Versiones estandarizadas en Docker (MongoDB 7.0, Node LTS)
- Scripts: `npm run dev`, `npm run backend`, `npm run frontend`
- Infraestructura replicable entre entornos


### 2.7. Análisis de calidad (SonarQube Cloud)
**Proyecto**: CSKCREATIONS/ola (Public) | **Rama**: main

| Categoría | Estado | Métricas |
|-----------|--------|----------|
| **Security** | ✅ A | 0 issues |
| **Reliability** | ✅ A | 4 issues |
| **Maintainability** | ✅ A | 8 issues |
| **Duplications** | ℹ️ | 3% controlada |
| **Coverage** | ⚠️ | 3% (requiere config) |

**Quality Gate**: Passed (Sonar way)


## 3. Requisitos no funcionales por capa

### 3.1. Backend
**Gestión de datos**:
- Índices MongoDB en campos críticos (User, Category, Product, Pedido, Remision, Cliente)
- Validación estricta (Mongoose + express-validator)

**Resiliencia**:
- Healthchecks en Docker
- Apagado elegante (SIGTERM)

**Seguridad**:
- Control de permisos granular con middlewares
- Sanitización y rate-limiting

**Rendimiento**:
- Pruebas de carga con wrk en `/wrk/resultados_wrk_*`

### 3.2. Frontend
**Cliente HTTP**:
- Centralizado en `src/api/axiosConfig.js`
- Manejo de errores global (401/403)
- Timeouts y cancelación de solicitudes

**Rendimiento**:
- Code-splitting por rutas
- Optimización con lazy loading

**Accesibilidad**:
- Formularios con labels claros
- Feedback de errores visible
- Navegación por teclado


## 4. Diseño de API y contratos

**Versionado**: `/api/v1` con política de deprecación

**Convenciones**:
- Respuestas JSON uniformes: `{ data, error, meta }`
- Errores con `code`, `message`, `details`, `traceId`
- Paginación: `?page=&limit=`
- Orden: `?sort=campo,-otro`

**Validación**: Esquemas por ruta; 400 con detalles por campo

**Idempotencia**: `Idempotency-Key` para operaciones críticas (pedidos, cotizaciones)

**Documentación**: OpenAPI/Swagger en `/api/docs`


## 5. Estrategia de pruebas (Test Pyramid)

### End-to-End (Playwright)
**16 suites E2E** cubriendo flujos completos de negocio:
- Login, usuarios, roles y permisos
- Clientes (lista y prospectos)
- Cotizaciones (registro y listado)
- Pedidos (agendados, entregados, cancelados)
- Productos, categorías, proveedores
- Órdenes de compra e historial de compras

**Configuración**:
- `playwright.config.ts` con reporters y retries
- Scripts: `test:e2e`, `test:e2e:ui`, `test:verify`
- Reportes automáticos en CI
- Documentación: `TESTS_README.md`, `EJECUTAR_TESTS.md`

### Pruebas de rendimiento (wrk)
- Scripts almacenados en `/wrk`
- Resultados documentados en `/wrk/resultados_wrk_*`


## 6. Observabilidad y operatividad

**Logging**:
- Morgan para logging HTTP básico
- Console logs en desarrollo
- Logs estructurados en producción (recomendado para siguiente iteración)

**Endpoints de salud**:
- `/health`: Verificación rápida (status, timestamp)
- `/ready`: Estado de conexión MongoDB (200 ok / 503 no disponible)


## 7. Seguridad y cumplimiento (OWASP/ASVS)

**Prácticas implementadas**:
- Revisión de permisos en cada PR
- SCA: `npm audit` + Snyk/Dependabot
- Gestión de secretos: `.env` seguros, rotación periódica
- CORS restringido a dominios conocidos
- Sanitización y límites en payloads
- Auditoría de acciones sensibles con usuario, timestamp y resultado

**Plan de respuesta a incidentes**:
- Severidad: P1/P2/P3
- SLAs definidos por severidad
- Canal de escalamiento establecido
- Postmortem obligatorio para P1


## 8. Configuración y despliegue (CI/CD)

### Integración continua (GitHub Actions)
**Pipeline** ejecuta:
- Instalación de dependencias (Node LTS)
- Instala navegadores Playwright
- Ejecuta tests E2E completos
- Publica reportes (30 días retención)
- **Triggers**: push y PR a main/master

### Despliegue continuo (Docker)
**Arquitectura**:
- MongoDB 7.0 con healthcheck
- Backend: Node/Express (`cskcreations/pangea-backend:latest`)
- Frontend: React + Nginx (`cskcreations/pangea-frontend:latest`)

**Configuración**:
- Proxy Nginx: `/api/*` → backend:5000
- Variables de entorno diferenciadas
- Networking interno entre servicios
- **Producción**: http://pangea.casacam.net (VM Ubuntu)

**Documentación**: `DEPLOYMENT.md`


## 9. Gestión de versiones y ramas

**Versionado**: SemVer (MAJOR.MINOR.PATCH)

**Estrategia**:
- Trunk-based con `main` protegido
- Ramas cortas: `feat/*`, `fix/*`
- PR requiere: CI verde, 1-2 revisores, checklist de calidad

**Convenciones**: Conventional Commits


## 10. Estándares de código y documentación

**Estilo**:
- ESLint en frontend
- Convenciones de carpetas: controllers, services, models, routes

**Documentación**:
- `README.md`: Guía principal
- `QUALITY_MODEL.md`: Este documento
- `TESTS_README.md`: Ejecución de tests E2E
- `EJECUTAR_TESTS.md`: Instrucciones detalladas
- `DEPLOYMENT.md`: Despliegue con Docker
- `PERMISOS_SISTEMA.md`: Sistema de permisos
- `backend/README.md`: Backend específico
- Scripts: `verificar-servicios.ps1`


## 11. Gestión de datos y backups

**Índices MongoDB**:
- User: username, email (unique)
- Category: name (unique)
- Product: name (unique), category, proveedor
- Pedido: numeroPedido (unique)
- Remision: numeroRemision (unique), estado, fechaRemision, cliente.nombre
- Cliente: correo (unique)

**Backups**:
- Scripts: `backup.bat` y `restore.bat` (Windows)
- Almacenamiento: `/backend/backups/` con timestamps
- Documentación: `backup-pangea/backup.md`


## 12. Presupuestos y métricas de calidad

**Error budget**: Disponibilidad 99.5% ⇒ presupuesto de indisponibilidad: 0.5%

**Fórmulas**:
- Disponibilidad: `A = 1 - (TiempoCaído / TiempoTotal)`
- Tasa de despliegues exitosos: ≥ 95% mensual


## 13. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Caídas en MongoDB | Readiness check, reintentos, validación de URI |
| Permisos mal configurados | Pruebas de autorización, checklist de rutas |
| Carga alta en PDFs | Considerar colas BullMQ, límites de concurrencia |
| Errores dispersos en HTTP | Cliente centralizado con timeouts uniformes ✅ |
| Tokens en localStorage | Sanitización estricta + expiración corta, revisión XSS |


## 14. Pilares de calidad implementados

✅ **Testing automatizado**: 16 suites E2E + pruebas de carga  
✅ **Seguridad en profundidad**: Defense-in-depth con múltiples capas  
✅ **Observabilidad**: Healthchecks + logs estructurados  
✅ **Infraestructura como código**: Docker + Docker Compose  
✅ **Gestión de datos**: Validaciones estrictas + backups  
✅ **Documentación completa**: 7 documentos técnicos del ecosistema


## 15. Puertas de calidad (Quality Gates)

### Antes del merge a main
- ✅ CI completo sin fallos (E2E + auditorías)
- ✅ SonarQube Quality Gate: **Passed**
- ✅ Revisión manual de flujos críticos

**Checklist de seguridad**:
- [ ] Cambios en permisos revisados
- [ ] No exposición de datos sensibles
- [ ] Validaciones correctas en nuevos endpoints
- [ ] Documentación actualizada (si aplica)

### Antes del despliegue
- ✅ Ejecución de E2E en staging
- ✅ Verificación manual de:
  - Login y autenticación
  - CRUD principales
  - Gestión de pedidos y cotizaciones
  - Generación de PDF/Excel
- ✅ Revisión de logs del backend
- ✅ Backup automático previo
- ✅ Confirmación de infraestructura disponible (Mongo + API + Nginx)


## 16. Checklist de PR

- [ ] Cambios documentados y pruebas actualizadas
- [ ] Lint y tests en verde
- [ ] Contratos de API respetados (versionado si aplica)
- [ ] Validación de permisos y manejo de errores consistente
- [ ] Sin secretos o credenciales en el código
- [ ] SonarQube Quality Gate: Passed

## 17. Roles y responsabilidades (RACI)

| Rol | Responsabilidad |
|-----|-----------------|
| **Propietario técnico** | Define estándares, aprueba arquitectura |
| **Revisores** | Aplican checklist, políticas de seguridad |
| **Developers** | Implementan con pruebas, respetan modelo de calidad |
| **Ops** | Despliegue, monitoreo, respuesta a incidentes |

## 18. Métricas y reporting

**Dashboard recomendado** (Grafana/Datadog):
- Latencia por ruta
- Tasa de errores
- Uso de recursos (CPU/memoria)
- Disponibilidad del servicio

**Reporte quincenal**:
- Evolución de cobertura
- Vulnerabilidades abiertas
- Tiempo medio de entrega
- Incidentes y resolución

---

**Nota**: Este modelo es vivo y debe revisarse al menos cada trimestre o cuando cambien significativamente la arquitectura, los riesgos o los objetivos de negocio.