// Script para agregar el permiso roles.ver a los roles que lo necesitan
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Role = require('../models/Role');

async function agregarPermisoRolesVer() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔧 Agregando permiso roles.ver a roles...');

    // Lista de roles que deben tener el permiso roles.ver
    const rolesQueNecesitanPermiso = [
      'Administrador',
      'Gerente',
      // Puedes agregar más roles aquí si lo necesitas
    ];

    let rolesActualizados = 0;

    for (const roleName of rolesQueNecesitanPermiso) {
      // Buscar el rol (case-insensitive)
      const role = await Role.findOne({ 
        name: { $regex: new RegExp(`^${roleName}$`, 'i') }
      });

      if (role) {
        // Verificar si ya tiene el permiso
        if (!role.permissions.includes('roles.ver')) {
          role.permissions.push('roles.ver');
          await role.save();
          console.log(`✅ Permiso agregado al rol: ${role.name}`);
          rolesActualizados++;
        } else {
          console.log(`ℹ️  El rol ${role.name} ya tiene el permiso roles.ver`);
        }
      } else {
        console.log(`⚠️  Rol no encontrado: ${roleName}`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Roles actualizados: ${rolesActualizados}`);

    // Verificar el resultado
    console.log('\n🔍 Verificando roles con permiso roles.ver:');
    const rolesConPermiso = await Role.find({ permissions: 'roles.ver' });
    
    if (rolesConPermiso.length > 0) {
      rolesConPermiso.forEach(role => {
        console.log(`   ✅ ${role.name} (${role.enabled !== false ? 'Habilitado' : 'Deshabilitado'})`);
        console.log(`      Permisos totales: ${role.permissions.length}`);
      });
    } else {
      console.log('   ⚠️  Todavía no hay roles con el permiso roles.ver');
    }

    console.log('\n✅ Actualización completada');
    console.log('💡 Los usuarios con estos roles ahora podrán ver la lista de roles');

  } catch (error) {
    console.error('❌ Error en la actualización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
agregarPermisoRolesVer();
