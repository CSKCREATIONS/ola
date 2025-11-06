# Solución: Roles no aparecían en la página

## Problema identificado
Los roles no aparecían en la página `/RolesYPermisos` porque **NINGÚN ROL en la base de datos tenía el permiso `roles.ver`**.

## Causa raíz
El middleware `checkPermission('roles.ver')` en la ruta `GET /api/roles` bloqueaba el acceso porque:
1. El endpoint requiere el permiso `roles.ver`
2. Ningún rol en la BD tenía ese permiso asignado
3. Por lo tanto, todos los usuarios recibían 403 Forbidden

## Solución aplicada
Se ejecutó el script `agregarPermisoRolesVer.js` que:
- Agregó el permiso `roles.ver` al rol **Administrador**
- Agregó el permiso `roles.ver` al rol **Gerente**

### Resultado
- ✅ Rol Administrador: 59 permisos totales (incluido `roles.ver`)
- ✅ Rol Gerente: 14 permisos totales (incluido `roles.ver`)

## Pasos para el usuario

### 1. Cerrar sesión
El usuario actual debe cerrar sesión en el frontend para que el token JWT sea descartado.

### 2. Iniciar sesión nuevamente
Al iniciar sesión, el backend generará un nuevo token JWT con los permisos actualizados del rol.

### 3. Verificar
Navegar a la página "Usuarios y Roles" → "Lista de Roles" y verificar que ahora se muestren los 10 roles existentes.

## Prevención futura
Los roles base del sistema siempre deben incluir:
- `roles.ver` - Para ver la lista de roles
- `roles.crear` - Para crear nuevos roles  
- `roles.editar` - Para editar roles existentes
- `roles.inhabilitar` - Para habilitar/deshabilitar roles

## Scripts útiles
- `verificarPermisoRoles.js` - Verifica qué usuarios tienen permiso roles.ver
- `agregarPermisoRolesVer.js` - Agrega el permiso roles.ver a roles específicos
- `verificarRoles.js` - Lista todos los roles y su estado
