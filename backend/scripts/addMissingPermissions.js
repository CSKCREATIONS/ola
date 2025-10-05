const mongoose = require('mongoose');
const Role = require('../models/Role');

// Configuración de conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pangea');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const addMissingPermissions = async () => {
  try {
    await connectDB();

    console.log('🔍 Verificando permisos faltantes en roles existentes...');

    // Definir todos los permisos que deben existir en el sistema
    const todosLosPermisos = [
      // Usuarios
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.inhabilitar', 'usuarios.eliminar',
      
      // Roles
      'roles.ver', 'roles.crear', 'roles.editar', 'roles.inhabilitar',
      
      // Productos
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.inactivar', 'reportesProductos.ver',
      
      // Categorías
      'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.inactivar',
      
      // Subcategorías
      'subcategorias.ver', 'subcategorias.crear', 'subcategorias.editar', 'subcategorias.inactivar',
      
      // Proveedores
      'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.inactivar', 'proveedores.activar',
      
      // Compras
      'hcompras.ver', 'compras.crear', 'reportesCompras.ver',
      
      // Órdenes de Compra
      'ordenesCompra.ver', 'ordenes.generar', 'ordenes.editar', 'ordenes.eliminar', 'ordenes.aprobar',
      
      // Ventas
      'ventas.crear', 'pedidos.ver', 'listaDeVentas.ver', 'pedidosAgendados.ver', 
      'pedidosDespachados.ver', 'pedidosEntregados.ver', 'pedidosCancelados.ver', 
      'pedidosDevueltos.ver', 'reportesVentas.ver', 'pedidos.remisionar', 'pedidos.enviar',
      
      // Cotizaciones
      'cotizaciones.ver', 'cotizaciones.crear', 'cotizaciones.editar', 'cotizaciones.eliminar',
      'cotizaciones.enviar', 'cotizaciones.remisionar',
      
      // Remisiones
      'remisiones.ver', 'remisiones.crear', 'remisiones.editar', 'remisiones.eliminar', 'remisiones.enviar',
      
      // Clientes
      'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.inactivar',
      
      // Prospectos
      'prospectos.ver'
    ];

    // Obtener todos los roles existentes
    const roles = await Role.find({});
    console.log(`📋 Encontrados ${roles.length} roles existentes`);

    for (const role of roles) {
      console.log(`\n🔧 Actualizando rol: ${role.name}`);
      
      let permisosAgregados = [];
      
      // Agregar permisos según el tipo de rol
      if (role.name === 'Administrador') {
        // El administrador debe tener TODOS los permisos
        for (const permiso of todosLosPermisos) {
          if (!role.permissions.includes(permiso)) {
            role.permissions.push(permiso);
            permisosAgregados.push(permiso);
          }
        }
      } 
      else if (role.name === 'Vendedor') {
        // Permisos específicos para vendedores
        const permisosVendedor = [
          'ventas.crear', 'listaDeVentas.ver', 'pedidosAgendados.ver', 
          'pedidosDespachados.ver', 'pedidosEntregados.ver', 'pedidosCancelados.ver', 
          'pedidosDevueltos.ver', 'cotizaciones.ver', 'cotizaciones.crear', 
          'cotizaciones.editar', 'cotizaciones.eliminar', 'cotizaciones.enviar', 
          'cotizaciones.remisionar', 'clientes.ver', 'clientes.crear', 
          'clientes.editar', 'prospectos.ver', 'productos.ver', 'categorias.ver', 
          'subcategorias.ver', 'remisiones.ver', 'remisiones.crear', 'pedidos.remisionar'
        ];
        
        for (const permiso of permisosVendedor) {
          if (!role.permissions.includes(permiso)) {
            role.permissions.push(permiso);
            permisosAgregados.push(permiso);
          }
        }
      }
      else if (role.name === 'Jefe de compras') {
        // Permisos específicos para jefe de compras
        const permisosJefeCompras = [
          'hcompras.ver', 'compras.crear', 'reportesCompras.ver',
          'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 
          'proveedores.inactivar', 'proveedores.activar', 'ordenesCompra.ver', 
          'ordenes.generar', 'ordenes.editar', 'ordenes.eliminar', 
          'ordenes.aprobar', 'productos.ver', 'categorias.ver', 'subcategorias.ver'
        ];
        
        for (const permiso of permisosJefeCompras) {
          if (!role.permissions.includes(permiso)) {
            role.permissions.push(permiso);
            permisosAgregados.push(permiso);
          }
        }
      }
      else if (role.name === 'Encargado de inventario') {
        // Permisos específicos para encargado de inventario
        const permisosInventario = [
          'productos.ver', 'productos.crear', 'productos.editar', 
          'productos.inactivar', 'reportesProductos.ver', 'categorias.ver', 
          'categorias.crear', 'categorias.editar', 'categorias.inactivar',
          'subcategorias.ver', 'subcategorias.crear', 'subcategorias.editar', 
          'subcategorias.inactivar', 'hcompras.ver', 'proveedores.ver',
          'cotizaciones.ver'
        ];
        
        for (const permiso of permisosInventario) {
          if (!role.permissions.includes(permiso)) {
            role.permissions.push(permiso);
            permisosAgregados.push(permiso);
          }
        }
      }

      // Guardar cambios
      if (permisosAgregados.length > 0) {
        await role.save();
        console.log(`   ✅ Agregados ${permisosAgregados.length} permisos:`);
        permisosAgregados.forEach(p => console.log(`     + ${p}`));
      } else {
        console.log(`   ℹ️  No se agregaron permisos nuevos`);
      }
    }

    // Verificar el estado final
    console.log('\n📊 RESUMEN FINAL:');
    const rolesActualizados = await Role.find({});
    for (const role of rolesActualizados) {
      console.log(`${role.name}: ${role.permissions.length} permisos totales`);
    }

    mongoose.disconnect();
    console.log('\n✅ Actualización de permisos completada');

  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

addMissingPermissions();