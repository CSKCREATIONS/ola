# Modelo de Calidad del Proyecto

Este documento define el modelo de calidad para el sistema (backend Node.js/Express + MongoDB y frontend React) con el objetivo de alinear expectativas, criterios de aceptación, métricas, procesos y responsabilidades para asegurar que el software cumpla de forma consistente con los requisitos funcionales y no funcionales.


## 1. Contexto y alcance

- Arquitectura actual:
  - Backend: Node.js (Express), MongoDB (Mongoose), JWT para autenticación, modelo de permisos basado en roles.
  - Frontend: React, cliente HTTP centralizado con axios, almacenamiento de token en localStorage.
  - API REST bajo prefijo `/api/*`.
- Entornos previstos: desarrollo, pruebas (staging) y producción.
- Usuarios principales: administradores, vendedores, compradores, operadores de logística y perfiles de consulta.
- Datos sensibles: credenciales de usuario, información de clientes, ventas, compras, productos y documentos asociados (cotizaciones, remisiones, órdenes de compra).


## 2. Atributos de calidad (ISO/IEC 25010) y metas medibles

Para cada atributo se definen objetivos, métricas (SLI), metas (SLO) y métodos de verificación.

### 2.1. Disponibilidad y confiabilidad
- Objetivo: sistema disponible y estable para operaciones de negocio.
- SLI:
  - Disponibilidad mensual: porcentaje de tiempo sin caídas del API.
  - Tasa de errores 5xx por minuto.
  - Tiempo medio de recuperación (MTTR).
- SLO:
  - Disponibilidad ≥ 99.5% mensual.
  - Error 5xx ≤ 1% de las solicitudes.
  - MTTR ≤ 30 minutos en horario laboral.
- Verificación: monitoreo con alertas; pruebas de resiliencia; drills de recuperación.

### 2.2. Rendimiento y eficiencia
- Objetivo: respuestas oportunas y uso eficiente de recursos.
- SLI:
  - p95 de latencia por endpoint crítico.
  - Throughput (req/s) sostenido del API.
  - Uso de CPU y memoria del proceso.
- SLO:
  - p95 ≤ 400 ms para endpoints CRUD; p95 ≤ 1200 ms para generación de PDF/reportes.
  - Frontend LCP ≤ 2.5 s en equipos de oficina típicos (red cableada) para vistas principales.
- Verificación: pruebas de carga (k6/JMeter), Lighthouse en vistas, perfiles de rendimiento.

### 2.3. Seguridad
- Objetivo: proteger confidencialidad, integridad y disponibilidad.
- Controles implementados:
  - **Autenticación JWT**: bcryptjs para hash de contraseñas con salt factor 10
  - **Autorización basada en roles**: Middleware `authJwt.js` y `role.js` verifican permisos por ruta
  - **Transporte seguro**: CORS configurado con orígenes permitidos (localhost y pangea.casacam.net); HTTPS en producción
  - **Gestión de secretos**: Variables de entorno con dotenv (MongoDB URI, JWT secret, API keys)
  - **Validación de entradas**: express-validator + express-mongo-sanitize contra NoSQL injection
  - **Cabeceras de seguridad**: Helmet configurado en `server.js`
  - **Rate limiting**: express-rate-limit con trust proxy para IPs reales
  - **Sanitización HTML**: sanitize-html para prevenir XSS en contenido rico
  - **Validación de email**: Regex robusto contra catastrophic backtracking en modelo Cliente
- Verificación: npm audit disponible para escaneo de dependencias vulnerables

### 2.4. Mantenibilidad
- Objetivo: facilitar cambios seguros y rápidos.
- Medidas:
  - Lint y formateo: ESLint + Prettier obligatorios en CI.
  - Cobertura de pruebas: global ≥ 70%; módulos críticos (auth, pedidos, ventas) ≥ 85%.
  - Acoplamiento bajo y separación por capas (controllers, services, models, middlewares).
  - Documentación: README, API (OpenAPI), guía de contribución.
- Verificación: revisiones de PR con checklist; análisis estático; métricas de complejidad.

### 2.5. Usabilidad y accesibilidad (Frontend)
- Objetivo: interfaz clara, consistente y accesible.
- Metas:
  - Cumplimiento WCAG 2.1 AA en vistas principales (contraste, navegación por teclado, labels).
  - Evitar bloqueos por 403/401: mensajes claros y rutas de acción.
- Verificación: auditorías manuales con checklist y Lighthouse Accessibility ≥ 90.

### 2.6. Compatibilidad y portabilidad
- Objetivo: facilidad para desplegar y operar en entornos equivalentes.
- Implementación:
  - **12-Factor App**: Configuración completa por variables de entorno (dotenv)
    - Backend: MONGODB_URI, JWT_SECRET, PORT, NODE_ENV, CORS origins, SendGrid API key
    - Frontend: REACT_APP_API_URL (proxy), NODE_ENV
  - **Paridad de entornos**: Docker Compose garantiza mismas versiones
    - MongoDB: 7.0
    - Node: LTS (especificado en Dockerfile)
    - Dependencias: package-lock.json versionado
  - **Containerización**: Dockerfiles optimizados para backend y frontend
  - **Scripts estandarizados**: `npm run dev`, `npm run backend`, `npm run frontend`


## 3. Requisitos no funcionales por capa

### 3.1. Backend (Express + MongoDB)

**Rendimiento:**
- Mediciones de carga disponibles con wrk en `/wrk/resultados_wrk_*`
- Pruebas de concurrencia realizadas sobre endpoints principales

**Resiliencia:**
- Apagado elegante con cierre de conexiones Mongo en señales SIGTERM/SIGINT
- Healthchecks configurados en Docker Compose

**Gestión de datos:**
- **Índices en campos clave**:
  - User: username, email (unique)
  - Category: name (unique con gestión de índices problemáticos)
  - Product: name (unique), category, proveedor (refs)
  - Pedido: numeroPedido (unique)
  - Remision: numeroRemision (unique), estado, fechaRemision, cliente.nombre
  - Cliente: correo (unique con validación regex robusta)
- **Validación Mongoose**: Esquemas completos con validadores, tipos y mensajes de error

**Seguridad:**
- Middlewares: `helmet`, `cors` restringido, `express-rate-limit`, `express-mongo-sanitize`
- Verificación de permisos: Middleware `authJwt` y `role` en rutas protegidas

### 3.2. Frontend (React)
- Cliente HTTP único (`src/api/axiosConfig.js`) con:
  - BaseURL por entorno (`REACT_APP_API_URL`); headers `Authorization` y `x-access-token`.
  - Manejo global de 401/403 y mensajes al usuario.
  - Timeouts (p.ej., 10 s) y cancelación de solicitudes en desmontaje.
- Rendimiento:
  - Code-splitting por rutas pesadas.
  - Caching de datos idempotentes (SWR/React Query recomendado para consistencia futura).
- Accesibilidad: formularios con labels; feedback de errores; focus management.


## 4. Diseño de API y contratos

- Versionado: prefijo `/api/v1`; política de deprecación con avisos ≥ 2 versiones.
- Convenciones:
  - Respuestas JSON con estructura uniforme `{ data, error, meta }`.
  - Errores con `code`, `message`, `details` y `traceId`.
  - Paginación estándar `?page=&limit=`; orden `?sort=campo,-otro`; filtros documentados.
- Validación de entrada: esquemas por ruta; 400 con detalles por campo.
- Idempotencia: para creación de pedidos/cotizaciones, admitir `Idempotency-Key` opcional.
- Documentación: OpenAPI/Swagger publicado en `/api/docs`.


## 5. Estrategia de pruebas (Test Pyramid)

### End-to-End (Playwright)
- **16 suites de pruebas E2E** cubriendo flujos críticos:
  - Login, usuarios, roles y permisos
  - Clientes (lista y prospectos)
  - Cotizaciones (registro y listado)
  - Pedidos (agendados, entregados, cancelados)
  - Productos, categorías, proveedores
  - Órdenes de compra e historial de compras
- Configuración en `playwright.config.ts` con reporters y retries
- Scripts disponibles: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:verify`
- Verificación previa de servicios con `verificar-servicios.ps1`
- Documentación completa en `TESTS_README.md` y `EJECUTAR_TESTS.md`

### Pruebas de rendimiento
- Herramienta `wrk` configurada en `/wrk` con scripts de pruebas de carga
- Resultados almacenados en `/wrk/resultados_wrk_*`


## 6. Observabilidad y operatividad

### Logging
- Morgan implementado para logging HTTP básico de todas las peticiones
- Logs de nivel aplicación con console en desarrollo

### Endpoints de salud
- `GET /health`: retorna `{status: 'ok', time: <timestamp>}` (respuesta rápida para healthchecks)
- `GET /ready`: verifica estado de conexión Mongoose, retorna 200 si conectado o 503 si no disponible


## 7. Seguridad y cumplimiento (OWASP/ASVS)

- Prácticas:
  - Revisiones de seguridad en PR para rutas nuevas y cambios de permisos.
  - Escaneo SCA en CI: `npm audit` (fail en críticas) + Snyk/Dependabot.
  - Gestión de secretos: `.env` seguros; rotación periódica.
  - Política de CORS: restringir a dominios conocidos; sin credenciales innecesarias.
  - Sanitización y limitación de tamaño de payloads.
- Auditoría:
  - Bitácora de acciones sensibles con usuario, timestamp y resultado.
- Plan de respuesta a incidentes:
  - Severidad P1/P2/P3; tiempos de respuesta; canal de escalamiento; postmortem obligatorio para P1.


## 8. Gestión de configuración y despliegue (CI/CD)

### Integración Continua (GitHub Actions)
- Pipeline en `.github/workflows/playwright.yml`:
  - Instalación de dependencias con Node LTS y npm ci
  - Instalación de navegadores Playwright
  - Ejecución de tests E2E completos
  - Publicación de reportes como artefactos (30 días retención)
  - Triggers: push y PR a main/master

### Despliegue Continuo (Docker)
- **Arquitectura de contenedores**:
  - MongoDB 7.0 con healthcheck configurado
  - Backend: Node/Express (imagen `cskcreations/pangea-backend:latest`)
  - Frontend: React + Nginx (imagen `cskcreations/pangea-frontend:latest`)
- **Configuración**:
  - Proxy inverso Nginx para rutas `/api/*` → backend:5000
  - Variables de entorno vía docker-compose.yml
  - Networking interno entre servicios
- **Producción**: http://pangea.casacam.net (VM Ubuntu)
- **Documentación**: `DEPLOYMENT.md` con pasos completos de despliegue


## 9. Gestión de versiones y ramas

- Versionado semántico (SemVer): MAJOR.MINOR.PATCH.
- Estrategia de ramas:
  - Trunk-based con `main` protegido; ramas cortas `feat/*`, `fix/*`.
  - Requisitos de PR: 1-2 revisores; CI verde; checklist de calidad.
- Convenciones de commits: Conventional Commits.


## 10. Estándares de código y documentación

### Estilo de código
- ESLint configurado en frontend (`eslintConfig` en package.json)
- Configuración para React app con globals definidos

### Documentación del proyecto
- **Documentos principales**:
  - `README.md`: Documentación principal del proyecto
  - `QUALITY_MODEL.md`: Este documento de modelo de calidad
  - `TESTS_README.md`: Guía completa de ejecución de tests E2E
  - `EJECUTAR_TESTS.md`: Instrucciones detalladas de testing
  - `DEPLOYMENT.md`: Guía de despliegue con Docker y pasos para VM
  - `PERMISOS_SISTEMA.md`: Documentación del sistema de permisos
  - `backend/README.md`: Documentación específica del backend
- **Scripts de verificación**: `verificar-servicios.ps1` para validar que servicios estén listos


## 11. Gestión de datos y backups

### MongoDB
- **Índices definidos en modelos**:
  - User: username, email (unique)
  - Category: name (unique con gestión de índices problemáticos)
  - Product: name (unique), category, proveedor (referencias)
  - Pedido: numeroPedido (unique)
  - Remision: numeroRemision (unique), estado, fechaRemision, cliente.nombre
  - Cliente: correo (unique con validación)

### Sistema de backups
- Scripts en `/backup-pangea`: `backup.bat` y `restore.bat` para Windows
- Respaldos almacenados en `/backend/backups/` con timestamps
- Documentación en `backup-pangea/backup.md`


## 12. Presupuestos y fórmulas de calidad

- Presupuesto de errores mensual (Error Budget):
  - Disponibilidad objetivo A = 99.5% ⇒ presupuesto de indisponibilidad: 0.5% del tiempo.
- Fórmula de disponibilidad:
  - A = 1 - (TiempoCaído / TiempoTotal)
- Métrica de éxito de despliegue:
  - Tasa de despliegues exitosos ≥ 95% mensual.


## 13. Riesgos clave y mitigación

- Conectividad a MongoDB inestable o mal configurada: validar `MONGODB_URI`, readiness check, reintentos.
- Permisos mal definidos generando 403 inesperados: pruebas de integración de autorización y checklist de rutas.
- Picos de carga en generación de PDFs: mover a cola (BullMQ) y procesadores dedicados; límites de concurrencia.
- Errores por fetch/axios dispersos: cliente HTTP central (hecho) y timeouts uniformes.
- Fugas de token en localStorage: rotación, expiraciones cortas, revisión de XSS.


## 14. Pilares de calidad implementados

### Testing automatizado
- 16 suites E2E con Playwright cubriendo flujos críticos de negocio
- CI/CD con GitHub Actions ejecutando tests en cada push/PR
- Scripts de verificación de servicios antes de ejecución
- Herramientas de pruebas de carga (wrk) con resultados documentados

### Seguridad en profundidad
- Autenticación JWT con bcrypt para contraseñas
- Autorización granular basada en roles y permisos
- Múltiples capas de protección: Helmet, CORS, rate-limiting, sanitización
- Validación robusta de entradas (express-validator, Mongoose schemas)
- Gestión segura de secretos vía variables de entorno

### Observabilidad
- Endpoints de salud para healthchecks y readiness
- Logging HTTP con Morgan
- Healthchecks de MongoDB en Docker Compose

### Infraestructura como código
- Dockerfiles optimizados para backend y frontend
- Docker Compose con networking y healthchecks
- Configuración 12-Factor con variables de entorno
- Imágenes versionadas en Docker Hub

### Gestión de datos
- Índices estratégicos en colecciones MongoDB
- Validaciones a nivel de esquema con Mongoose
- Sistema de backups con scripts documentados

### Documentación
- 7 documentos técnicos cubriendo testing, despliegue y permisos
- Scripts de automatización documentados
- READMEs específicos por componente


## 15. Puertas de calidad (Quality Gates)

### Tests E2E
- 16 suites Playwright ejecutándose automáticamente en CI (GitHub Actions)
- Triggers en push y pull requests a main/master
- Reportes publicados como artefactos con retención de 30 días
- Fallo de tests bloquea el merge

### Build
- Backend: Node/Express arranca sin errores
- Frontend: React build funciona (react-scripts build)

### Lint
- ESLint configurado en frontend con reglas react-app


## 16. Checklist de PR

- [ ] Cambios documentados y pruebas actualizadas.
- [ ] Lint y tests en verde.
- [ ] Se respetan contratos de API (versionado si aplica).
- [ ] Validación de permisos y manejo de errores consistente.
- [ ] Sin secretos o credenciales en el código.


## 17. Roles y responsabilidades (RACI)

- Propietario técnico: define estándares, aprueba arquitectura.
- Revisores: aplican checklist y políticas de seguridad.
- Devs: implementan con pruebas y respetan el modelo de calidad.
- Ops: despliegue, monitoreo y respuesta a incidentes.


## 18. Métricas y reporting

- Dashboard (Grafana/Datadog): latencia por ruta, errores, uso de recursos, disponibilidad.
- Reporte quincenal: evolución de cobertura, vulnerabilidades abiertas, tiempo medio de entrega, incidentes.


---

Este modelo es vivo: se debe revisar al menos cada trimestre o cuando cambien significativamente la arquitectura, los riesgos o los objetivos de negocio.