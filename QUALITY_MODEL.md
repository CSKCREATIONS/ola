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
- Controles clave:
  - Autenticación: JWT (expiración ≤ 24h), rotación/invalidación en logout.
  - Autorización: verificación de permisos por ruta (`roles.*`, `usuarios.*`, etc.) con middleware consistente.
  - Transporte: HTTPS obligatorio en prod, CORS restringido por origen.
  - Almacenamiento de secretos: variables de entorno, nunca en el repo.
  - Validación de entradas: validación de esquema a nivel API (celebrate/Joi o zod) y sanitización contra XSS/NoSQL injection.
  - Cabeceras de seguridad: Helmet.
  - Rate limiting: por IP y por token en endpoints sensibles.
  - Hash de contraseñas: bcrypt con salt robusto.
  - Auditoría: registro de acciones privilegiadas (creación/edición de roles, usuarios, remisiones, etc.).
- SLI/SLO:
  - Incidentes de severidad alta sin parche > 48h: 0.
  - Vulnerabilidades críticas abiertas (npm audit/Snyk): 0.
- Verificación: escaneo de dependencias (SCA), pruebas de seguridad (OWASP), revisión de permisos.

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
- Metas:
  - 12-Factor: configuración por variables de entorno.
  - Paridad de entornos: staging ≈ prod (versión de Node, Mongo, flags de compilación).
- Verificación: scripts de arranque estandarizados; `.env.example` actualizado.


## 3. Requisitos no funcionales por capa

### 3.1. Backend (Express + MongoDB)
- Tiempo de respuesta objetivo (p95):
  - CRUD típicos: ≤ 400 ms.
  - Endpoints pesados (PDF/email/reportes): ≤ 1200 ms.
- Concurrencia: soportar ≥ 50 req/s sostenidas en hardware estándar (tunning de pool Mongo, keep-alive, compresión).
- Resiliencia:
  - Timeouts para llamadas externas (p. ej., correo, PDF) ≤ 10 s; reintentos con backoff exponencial (3 intentos).
  - Apagado elegante con cierre de conexiones Mongo.
- Datos:
  - Índices en campos de búsqueda/relación (ej.: `Pedido.numero`, `Cliente.nit`, `Products.codigo`).
  - Validación con Mongoose; migraciones versionadas para cambios de esquema.
- Seguridad:
  - Middlewares: `helmet`, `cors` restringido, `rate-limit` y `express-mongo-sanitize`.
  - Verificación consistente de permisos por endpoint.

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

- Unitarias (rápidas):
  - Backend: Jest + ts-jest (si se migra a TS) o Jest puro; mocks de Mongoose.
  - Frontend: Jest + React Testing Library.
  - Meta: cobertura global ≥ 70%.
- Integración:
  - Backend: Supertest sobre Express; Mongo en memoria (mongodb-memory-server) o contenedor.
  - Casos: auth, permisos, flujos de ventas/pedidos/remisiones.
- End-to-End:
  - Playwright o Cypress: flujos críticos (login, CRUD productos, creación de pedido, remisionar).
  - Meta: suites críticas ejecutan en CI nocturna y antes de releases.
- No funcionales:
  - Carga: k6/JMeter sobre endpoints más usados; metas de p95 definidas.
  - Seguridad: ZAP baseline; `npm audit`/Snyk; secret scanning.


## 6. Observabilidad y operatividad

- Logging estructurado (pino/winston): nivel, timestamp, traceId, userId, permiso invocado.
- Correlación:
  - Inyectar `X-Request-Id` en API; middleware para propagar `req.id` y loggear por petición.
- Métricas (Prometheus):
  - Latencia y tasa por ruta, errores por código HTTP, uso de heap/CPU, conexiones Mongo.
- Salud:
  - `/health` (rápido) y `/ready` (dependencias: Mongo conectada).
- Trazas (opcional): OpenTelemetry para endpoints críticos.


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

- CI (GitHub Actions/GitLab CI sugerido):
  1) Instalar dependencias (Node LTS, cache).
  2) Lint + formateo (ESLint/Prettier).
  3) Pruebas unitarias + cobertura.
  4) Pruebas de integración backend con Mongo en memoria.
  5) Build frontend.
  6) Security scan (npm audit/Snyk) y CodeQL opcional.
- CD:
  - Despliegues automatizados por tag `v*` a staging; despliegue a prod con aprobación manual.
  - Variables por entorno (DB URI, JWT secret, CORS origins, API URL).
- Feature flags (opcional) para cambios de alto riesgo.


## 9. Gestión de versiones y ramas

- Versionado semántico (SemVer): MAJOR.MINOR.PATCH.
- Estrategia de ramas:
  - Trunk-based con `main` protegido; ramas cortas `feat/*`, `fix/*`.
  - Requisitos de PR: 1-2 revisores; CI verde; checklist de calidad.
- Convenciones de commits: Conventional Commits.


## 10. Estándares de código y documentación

- Estilo: ESLint + Prettier en todo el monorepo (backend y frontend).
- Formato: pre-commit hooks (Husky) ejecutan lint y pruebas rápidas.
- Documentación:
  - `README.md` actualizado (arranque, variables, scripts).
  - `QUALITY_MODEL.md` (este documento) y `CONTRIBUTING.md`.
  - API: OpenAPI con ejemplos.


## 11. Gestión de datos y backups

- MongoDB:
  - Índices en campos de búsqueda; revisión trimestral de performance.
  - Backups diarios (full) y horarios (incrementales) en producción.
  - RPO ≤ 24h; RTO ≤ 4h.
  - Entornos no productivos con datos anonimizados.


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


## 14. Roadmap de mejora (priorizado)

1) Corto plazo (1-2 sprints):
   - Añadir Helmet, rate-limiter y validación de esquemas.
   - Establecer CI con lint, tests y `npm audit` obligatorio.
   - Endpoint `/health` y `/ready` + logs estructurados.
   - Coverage mínimo del 60-70% en módulos críticos.
2) Medio plazo (3-5 sprints):
   - OpenAPI + portal de documentación.
   - Pruebas E2E (Cypress/Playwright) de flujos críticos.
   - Índices y perfilado de queries en Mongo.
   - Caching de listas y catálogos.
3) Largo plazo:
   - Observabilidad completa (métricas y trazas), colas para trabajos pesados, hardening de seguridad (SAST/DAST), accesibilidad AA en todas las vistas.


## 15. Puertas de calidad (Quality Gates)

- Build: debe compilar backend y frontend sin errores. Estado: pendiente de CI.
- Lint/Typecheck: ESLint sin errores; si se migra a TS, `tsc --noEmit` debe pasar.
- Tests: unitarios e integración con cobertura mínima. Fallo de cualquiera bloquea merge.
- Seguridad: `npm audit` sin críticas; dependencias vulnerables bloquean merge.


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