// Script para verificar si los usuarios tienen permiso roles.ver
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const Role = require('../models/Role');

async function verificarPermisoRoles() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los usuarios
    console.log('\n🔍 Verificando permisos de roles.ver en usuarios...');
    const usuarios = await User.find().populate('role');

    if (usuarios.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      return;
    }

    console.log(`\n📊 Se encontraron ${usuarios.length} usuarios:\n`);

    let usuariosConPermiso = 0;
    let usuariosSinPermiso = 0;

    usuarios.forEach((user, index) => {
      const tienePermiso = user.role?.permissions?.includes('roles.ver');
      
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   - Rol: ${user.role?.name || 'Sin rol'}`);
      console.log(`   - Habilitado: ${user.enabled !== false ? 'Sí' : 'No'}`);
      console.log(`   - Rol habilitado: ${user.role?.enabled !== false ? 'Sí' : 'No'}`);
      console.log(`   - Permiso roles.ver: ${tienePermiso ? '✅ SÍ' : '❌ NO'}`);
      
      if (tienePermiso) {
        usuariosConPermiso++;
      } else {
        usuariosSinPermiso++;
      }
      
      console.log('');
    });

    console.log(`\n📊 Resumen:`);
    console.log(`   - Usuarios con permiso roles.ver: ${usuariosConPermiso}`);
    console.log(`   - Usuarios sin permiso roles.ver: ${usuariosSinPermiso}`);

    // Verificar roles que tienen el permiso
    console.log('\n🔍 Roles con permiso roles.ver:');
    const roles = await Role.find({ permissions: 'roles.ver' });
    
    if (roles.length > 0) {
      roles.forEach(role => {
        console.log(`   - ${role.name} (${role.enabled !== false ? 'Habilitado' : 'Deshabilitado'})`);
      });
    } else {
      console.log('   ⚠️  NINGÚN ROL tiene el permiso roles.ver');
      console.log('   💡 Solución: Agregar el permiso roles.ver al rol Administrador');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la verificación
verificarPermisoRoles();
