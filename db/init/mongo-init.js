// This script runs automatically when MongoDB container initializes (first run)
// Mount it with: ./db/init:/docker-entrypoint-initdb.d:ro
// It will create the database, base indexes, and default roles if missing.

// Switch to target database
db = db.getSiblingDB('pangea');

// Ensure unique indexes similar to Mongoose models
try { db.roles.createIndex({ name: 1 }, { unique: true }); } catch (e) { print(e); }
try { db.users.createIndex({ email: 1 }, { unique: true }); } catch (e) { print(e); }
try { db.categories.createIndex({ name: 1 }, { unique: true }); } catch (e) { print(e); }
try { db.subcategories.createIndex({ name: 1 }, { unique: true }); } catch (e) { print(e); }
try { db.products.createIndex({ name: 1 }, { unique: true }); } catch (e) { print(e); }

// Minimal default roles (permissions flattened manually)
const PERMISSIONS = [
  // USUARIOS
  'usuarios.ver','usuarios.crear','usuarios.editar','usuarios.inhabilitar','usuarios.eliminar',
  // ROLES
  'roles.ver','roles.crear','roles.editar','roles.inhabilitar',
  // PRODUCTOS
  'productos.ver','productos.crear','productos.editar','productos.inactivar','reportesProductos.ver',
  // CATEGORIAS
  'categorias.ver','categorias.crear','categorias.editar','categorias.inactivar',
  // SUBCATEGORIAS
  'subcategorias.ver','subcategorias.crear','subcategorias.editar','subcategorias.inactivar',
  // PROVEEDORES
  'proveedores.ver','proveedores.crear','proveedores.editar','proveedores.inactivar','proveedores.activar',
  // COMPRAS
  'hcompras.ver','compras.crear','reportesCompras.ver',
  // ORDENES
  'ordenesCompra.ver','ordenes.generar','ordenes.editar','ordenes.eliminar','ordenes.aprobar',
  // VENTAS
  'ventas.crear','pedidos.ver','listaDeVentas.ver','pedidosAgendados.ver','pedidosDespachados.ver','pedidosEntregados.ver','pedidosCancelados.ver','pedidosDevueltos.ver','reportesVentas.ver','pedidos.remisionar','pedidos.enviar',
  // COTIZACIONES
  'cotizaciones.ver','cotizaciones.crear','cotizaciones.editar','cotizaciones.eliminar','cotizaciones.enviar','cotizaciones.remisionar',
  // REMISIONES
  'remisiones.ver','remisiones.crear','remisiones.editar','remisiones.eliminar','remisiones.enviar',
  // CLIENTES
  'clientes.ver','clientes.crear','clientes.editar','clientes.inactivar',
  // PROSPECTOS
  'prospectos.ver'
];

function ensureRole(name, permissions) {
  const exists = db.roles.findOne({ name });
  if (exists) {
    print(`[mongo-init] Role exists: ${name}`);
    return;
  }
  db.roles.insertOne({ name, permissions, enabled: true, createdAt: new Date(), updatedAt: new Date() });
  print(`[mongo-init] Role created: ${name}`);
}

ensureRole('admin', PERMISSIONS);
ensureRole('ventas', ['ventas.crear','pedidos.ver','pedidosEntregados.ver','pedidosAgendados.ver','pedidosDespachados.ver','pedidosCancelados.ver','reportesVentas.ver','cotizaciones.ver','cotizaciones.crear','cotizaciones.enviar']);
ensureRole('compras', ['hcompras.ver','compras.crear','reportesCompras.ver','proveedores.ver','proveedores.crear','proveedores.editar']);

print('[mongo-init] Initialization complete.');
