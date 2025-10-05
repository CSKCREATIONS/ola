// Script para verificar que existan roles en la base de datos
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Role = require('../models/Role');

async function verificarRoles() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los roles
    console.log('\n🔍 Buscando roles en la base de datos...');
    const roles = await Role.find();

    if (roles.length > 0) {
      console.log(`✅ Se encontraron ${roles.length} roles:`);
      
      roles.forEach((role, index) => {
        console.log(`\n${index + 1}. Rol: ${role.name}`);
        console.log(`   - ID: ${role._id}`);
        console.log(`   - Habilitado: ${role.enabled !== false ? 'Sí' : 'No'}`);
        console.log(`   - Permisos: ${role.permissions?.length || 0}`);
        if (role.permissions && role.permissions.length > 0) {
          console.log(`   - Algunos permisos: ${role.permissions.slice(0, 3).join(', ')}${role.permissions.length > 3 ? '...' : ''}`);
        }
        console.log(`   - Creado: ${role.createdAt ? new Date(role.createdAt).toLocaleDateString('es-ES') : 'N/A'}`);
      });
    } else {
      console.log('⚠️  No se encontraron roles en la base de datos');
      
      // Crear algunos roles básicos si no existen
      console.log('\n🚀 Creando roles básicos...');
      
      const rolesBasicos = [
        {
          name: 'Administrator',
          permissions: [
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.inactivar',
            'roles.ver', 'roles.crear', 'roles.editar', 'roles.inactivar',
            'productos.ver', 'productos.crear', 'productos.editar', 'productos.inactivar'
          ]
        },
        {
          name: 'Vendedor',
          permissions: [
            'productos.ver',
            'cotizaciones.crear', 'cotizaciones.ver', 'cotizaciones.editar',
            'clientes.ver', 'clientes.crear', 'clientes.editar'
          ]
        },
        {
          name: 'Jefe de compras',
          permissions: [
            'productos.ver',
            'proveedores.ver', 'proveedores.crear', 'proveedores.editar',
            'hcompras.ver', 'hcompras.crear'
          ]
        }
      ];

      for (const rolData of rolesBasicos) {
        const nuevoRol = new Role(rolData);
        await nuevoRol.save();
        console.log(`✅ Rol creado: ${rolData.name}`);
      }

      console.log('\n✅ Roles básicos creados');
    }

    // Verificar estructura de los roles
    console.log('\n📊 Estadísticas de roles:');
    const rolesHabilitados = await Role.countDocuments({ enabled: { $ne: false } });
    const rolesDeshabilitados = await Role.countDocuments({ enabled: false });
    
    console.log(`   - Roles habilitados: ${rolesHabilitados}`);
    console.log(`   - Roles deshabilitados: ${rolesDeshabilitados}`);
    console.log(`   - Total de roles: ${roles.length || rolesBasicos?.length || 0}`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la verificación
verificarRoles();