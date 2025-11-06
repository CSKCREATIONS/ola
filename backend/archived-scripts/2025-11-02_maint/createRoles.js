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

const createRoles = async () => {
  try {
    await connectDB();

    // Eliminar roles existentes para empezar limpio
    await Role.deleteMany({});

    // Crear rol Administrador
    const adminRole = new Role({
      name: 'Administrador',
      permissions: [
        'roles.crear', 'roles.inhabilitar', 'roles.editar', 'roles.ver',
        'usuarios.crear', 'usuarios.editar', 'usuarios.inhabilitar', 'usuarios.eliminar', 'usuarios.ver',
        'cotizaciones.crear', 'cotizaciones.ver', 'cotizaciones.editar', 'cotizaciones.eliminar', 'cotizaciones.enviar', 'cotizaciones.remisionar',
        'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.inactivar',
        'subcategorias.ver', 'subcategorias.crear', 'subcategorias.editar', 'subcategorias.inactivar',
        'productos.ver', 'productos.crear', 'productos.editar', 'productos.inactivar', 'reportesProductos.ver',
        'ventas.crear', 'pedidos.ver', 'listaDeVentas.ver', 'pedidosAgendados.ver', 'pedidosDespachados.ver', 'pedidosEntregados.ver', 'pedidosCancelados.ver', 'pedidosDevueltos.ver', 'reportesVentas.ver',
        'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.inactivar',
        'prospectos.ver',
        'hcompras.ver', 'compras.crear', 'reportesCompras.ver',
        'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.inactivar',
        'ordenes.generar', 'ordenesCompra.ver', 'ordenes.editar', 'ordenes.eliminar', 'ordenes.aprobar'
      ],
      enabled: true
    });

    // Crear rol Vendedor
    const vendedorRole = new Role({
      name: 'Vendedor',
      permissions: [
        'listaDeVentas.ver', 'ventas.crear', 'pedidosAgendados.ver', 'pedidosDespachados.ver', 'pedidosEntregados.ver', 'pedidosCancelados.ver', 'pedidosDevueltos.ver',
        'cotizaciones.ver', 'cotizaciones.crear', 'cotizaciones.editar', 'cotizaciones.eliminar', 'cotizaciones.enviar', 'cotizaciones.remisionar',
        'clientes.ver', 'clientes.crear', 'clientes.editar',
        'prospectos.ver'
      ],
      enabled: true
    });

    // Crear rol Jefe de compras
    const jefeComprasRole = new Role({
      name: 'Jefe de compras',
      permissions: [
        'hcompras.ver', 'compras.crear', 'reportesCompras.ver',
        'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.inactivar',
        'ordenesCompra.ver', 'ordenes.generar', 'ordenes.editar', 'ordenes.eliminar', 'ordenes.aprobar'
      ],
      enabled: true
    });

    // Crear rol Encargado de inventario
    const inventarioRole = new Role({
      name: 'Encargado de inventario',
      permissions: [
        'hcompras.ver', 'proveedores.ver',
        'productos.ver', 'productos.crear', 'productos.editar', 'productos.inactivar', 'reportesProductos.ver',
        'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.inactivar',
        'subcategorias.ver', 'subcategorias.crear', 'subcategorias.editar', 'subcategorias.inactivar'
      ],
      enabled: true
    });

    // Guardar todos los roles
    await adminRole.save();
    await vendedorRole.save();
    await jefeComprasRole.save();
    await inventarioRole.save();

    console.log('✅ Roles creados correctamente:');
    console.log(`- Administrador (${adminRole._id})`);
    console.log(`- Vendedor (${vendedorRole._id})`);
    console.log(`- Jefe de compras (${jefeComprasRole._id})`);
    console.log(`- Encargado de inventario (${inventarioRole._id})`);

    console.log('\n📋 Permisos de cotizaciones por rol:');
    const roles = await Role.find({});
    roles.forEach(role => {
      const cotizacionPerms = role.permissions.filter(p => p.includes('cotizaciones'));
      console.log(`${role.name}: ${cotizacionPerms.join(', ')}`);
    });

    mongoose.disconnect();
    console.log('\n✅ Script completado');
  } catch (error) {
    console.error('❌ Error creando roles:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

createRoles();