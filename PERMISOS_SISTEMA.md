# PERMISOS DEL SISTEMA PANGEA

## Lista completa de permisos disponibles para asignar a roles

### 👥 MÓDULO USUARIOS (5 permisos)
- `usuarios.ver` - Ver lista de usuarios
- `usuarios.crear` - Crear nuevos usuarios  
- `usuarios.editar` - Editar información de usuarios
- `usuarios.deshabilitar` - Habilitar/deshabilitar usuarios
- `usuarios.eliminar` - Eliminar usuarios del sistema

### 🔐 MÓDULO ROLES (4 permisos)
- `roles.ver` - Ver roles y permisos
- `roles.crear` - Crear nuevos roles
- `roles.editar` - Editar roles existentes
- `roles.deshabilitar` - Habilitar/deshabilitar roles

### 📦 MÓDULO PRODUCTOS (4 permisos)
- `productos.ver` - Ver catálogo de productos
- `productos.crear` - Crear nuevos productos
- `productos.editar` - Editar información de productos
- `productos.inactivar` - Activar/Inactivar productos

### 📁 MÓDULO CATEGORÍAS (8 permisos)
- `categorias.ver` - Ver categorías
- `categorias.crear` - Crear nuevas categorías
- `categorias.editar` - Editar categorías
- `categorias.inactivar` - Activar/Inactivar categorías

### 🏭 MÓDULO PROVEEDORES (5 permisos)
- `proveedores.ver` - Ver lista de proveedores
- `proveedores.crear` - Crear nuevos proveedores
- `proveedores.editar` - Editar información de proveedores
- `proveedores.inactivar` - Inactivar proveedores
- `proveedores.activar` - Activar proveedores

### 🛒 MÓDULO COMPRAS (2 permisos)
- `compras.ver` - Ver historial de compras
- `compras.crear` - Registrar nuevas compras

### 📋 MÓDULO ÓRDENES DE COMPRA (5 permisos)
- `ordenesCompra.ver` - Ver órdenes de compra
- `ordenes.generar` - Generar nuevas órdenes
- `ordenes.editar` - Editar órdenes existentes
- `ordenes.eliminar` - Eliminar órdenes
- `ordenes.aprobar` - Aprobar órdenes de compra

### 💰 MÓDULO VENTAS (2 permisos)

### 📝 MÓDULO PEDIDOS (8 permisos)
- `pedidos.ver` - Ver pedidos generales
- `pedidosAgendados.ver` - Ver pedidos agendados
- `pedidosCancelados.ver` - Ver pedidos cancelados
- `pedidos.remisionar` - Crear remisiones de pedidos
- `pedidos.enviar` - Enviar pedidos

### 💼 MÓDULO COTIZACIONES (6 permisos)
- `cotizaciones.ver` - Ver cotizaciones
- `cotizaciones.crear` - Crear nuevas cotizaciones
- `cotizaciones.editar` - Editar cotizaciones
- `cotizaciones.eliminar` - Eliminar cotizaciones
- `cotizaciones.enviar` - Enviar cotizaciones por correo
- `cotizaciones.remisionar` - Crear remisiones desde cotizaciones

### 📄 MÓDULO REMISIONES (5 permisos)
- `remisiones.ver` - Ver remisiones
- `remisiones.crear` - Crear nuevas remisiones
- `remisiones.editar` - Editar remisiones
- `remisiones.eliminar` - Eliminar remisiones
- `remisiones.enviar` - Enviar remisiones

### 👤 MÓDULO CLIENTES (4 permisos)
- `clientes.ver` - Ver lista de clientes
- `clientes.crear` - Crear nuevos clientes
- `clientes.editar` - Editar información de clientes
- `clientes.inactivar` - Activar/Inactivar clientes

### 🎯 MÓDULO PROSPECTOS (1 permiso)
- `prospectos.ver` - Ver lista de prospectos

### 📊 MÓDULO REPORTES (3 permisos)
- `reportesVentas.ver` - Ver reportes de ventas
- `reportesProductos.ver` - Ver reportes de productos
- `reportesCompras.ver` - Ver reportes de compras

---

## 🎭 ROLES CONFIGURADOS EN EL SISTEMA

### 1️⃣ **ADMINISTRADOR** (62 permisos)
- **Acceso**: COMPLETO a todo el sistema
- **Módulos**: Todos los módulos disponibles
- **Función**: Gestión total del sistema

### 2️⃣ **VENDEDOR** (23 permisos)
- **Acceso**: Ventas, cotizaciones, clientes, productos (lectura)
- **Módulos**: Ventas, Cotizaciones, Clientes, Pedidos, Remisiones
- **Función**: Gestión de ventas y atención al cliente

### 3️⃣ **JEFE DE COMPRAS** (16 permisos)
- **Acceso**: Compras, proveedores, órdenes de compra
- **Módulos**: Compras, Proveedores, Órdenes, Productos (lectura)
- **Función**: Gestión completa de compras y proveedores

### 4️⃣ **ENCARGADO DE INVENTARIO** (16 permisos)
- **Acceso**: Productos, categorías, inventario
- **Módulos**: Productos, Categorías,, Reportes de productos
- **Función**: Gestión completa del inventario

### 5️⃣ **SUPERVISOR DE VENTAS** (26 permisos)
- **Acceso**: Supervisión de ventas y equipo
- **Módulos**: Ventas, Cotizaciones, Clientes, Pedidos, Reportes, Usuarios (lectura)
- **Función**: Supervisión del área de ventas

### 6️⃣ **COORDINADOR DE INVENTARIO** (8 permisos)
- **Acceso**: Productos (limitado)
- **Módulos**: Productos, Categorías (lectura)
- **Función**: Apoyo en gestión de inventario

### 7️⃣ **ASISTENTE DE COMPRAS** (10 permisos)
- **Acceso**: Compras básicas y proveedores
- **Módulos**: Compras, Proveedores, Órdenes (limitado)
- **Función**: Apoyo en área de compras

### 8️⃣ **ANALISTA DE REPORTES** (16 permisos)
- **Acceso**: Solo lectura y reportes
- **Módulos**: Todos los reportes, datos en modo lectura
- **Función**: Análisis y generación de reportes

### 9️⃣ **OPERADOR** (7 permisos)
- **Acceso**: Solo lectura básica
- **Módulos**: Productos, Clientes, Cotizaciones (lectura)
- **Función**: Consulta básica de información

---

## 🔧 CÓMO USAR ESTOS PERMISOS

1. **Al crear un rol**: Selecciona los permisos específicos de la lista anterior
2. **Al asignar usuarios**: Asigna el rol que mejor se adapte a las funciones del usuario
3. **Para roles personalizados**: Combina permisos según las necesidades específicas

## 📝 NOTAS IMPORTANTES

- Todos los permisos están actualizados y funcionando en el sistema
- El rol de Administrador tiene acceso completo automáticamente
- Los permisos son acumulativos: un usuario puede tener múltiples roles
- Los permisos de "ver" son prerequisitos para los permisos de "crear/editar"