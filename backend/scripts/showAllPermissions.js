const mongoose = require('mongoose');
const Role = require('../models/Role');

const showAllPermissions = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pangea');
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los permisos únicos del sistema
    const roles = await Role.find({});
    const todosLosPermisos = new Set();
    
    roles.forEach(role => {
      role.permissions.forEach(permiso => {
        todosLosPermisos.add(permiso);
      });
    });

    const permisosOrdenados = Array.from(todosLosPermisos).sort();

    console.log('\n📋 TODOS LOS PERMISOS DISPONIBLES EN EL SISTEMA:');
    console.log('='.repeat(60));

    // Agrupar permisos por módulo
    const modulos = {
      'Usuarios': [],
      'Roles': [],
      'Productos': [],
      'Categorías': [],
      'Subcategorías': [],
      'Proveedores': [],
      'Compras': [],
      'Órdenes': [],
      'Ventas': [],
      'Pedidos': [],
      'Cotizaciones': [],
      'Remisiones': [],
      'Clientes': [],
      'Prospectos': [],
      'Reportes': []
    };

    permisosOrdenados.forEach(permiso => {
      if (permiso.includes('usuarios.')) modulos['Usuarios'].push(permiso);
      else if (permiso.includes('roles.')) modulos['Roles'].push(permiso);
      else if (permiso.includes('productos.')) modulos['Productos'].push(permiso);
      else if (permiso.includes('categorias.')) modulos['Categorías'].push(permiso);
      else if (permiso.includes('subcategorias.')) modulos['Subcategorías'].push(permiso);
      else if (permiso.includes('proveedores.')) modulos['Proveedores'].push(permiso);
      else if (permiso.includes('compras.') || permiso.includes('hcompras.')) modulos['Compras'].push(permiso);
      else if (permiso.includes('ordenes.') || permiso.includes('ordenesCompra.')) modulos['Órdenes'].push(permiso);
      else if (permiso.includes('ventas.') || permiso.includes('listaDeVentas.')) modulos['Ventas'].push(permiso);
      else if (permiso.includes('pedidos')) modulos['Pedidos'].push(permiso);
      else if (permiso.includes('cotizaciones.')) modulos['Cotizaciones'].push(permiso);
      else if (permiso.includes('remisiones.')) modulos['Remisiones'].push(permiso);
      else if (permiso.includes('clientes.')) modulos['Clientes'].push(permiso);
      else if (permiso.includes('prospectos.')) modulos['Prospectos'].push(permiso);
      else if (permiso.includes('reportes') || permiso.includes('Reportes')) modulos['Reportes'].push(permiso);
    });

    Object.entries(modulos).forEach(([modulo, permisos]) => {
      if (permisos.length > 0) {
        console.log(`\n📁 ${modulo.toUpperCase()}:`);
        permisos.forEach(permiso => {
          console.log(`   ✓ ${permiso}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL: ${permisosOrdenados.length} permisos disponibles`);
    
    console.log('\n🔍 PERMISOS POR ROL:');
    roles.forEach(role => {
      console.log(`\n👤 ${role.name} (${role.permissions.length} permisos):`);
      
      // Mostrar permisos agrupados por acciones
      const acciones = {
        'Ver': role.permissions.filter(p => p.includes('.ver')),
        'Crear': role.permissions.filter(p => p.includes('.crear') || p.includes('.generar')),
        'Editar': role.permissions.filter(p => p.includes('.editar')),
        'Eliminar/Inactivar': role.permissions.filter(p => p.includes('.eliminar') || p.includes('.inactivar') || p.includes('.inhabilitar')),
        'Especiales': role.permissions.filter(p => 
          !p.includes('.ver') && !p.includes('.crear') && !p.includes('.editar') && 
          !p.includes('.eliminar') && !p.includes('.inactivar') && !p.includes('.inhabilitar') && 
          !p.includes('.generar')
        )
      };

      Object.entries(acciones).forEach(([accion, permisos]) => {
        if (permisos.length > 0) {
          console.log(`   ${accion}: ${permisos.length} permisos`);
        }
      });
    });

    mongoose.disconnect();
    console.log('\n✅ Listado completado');

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

showAllPermissions();