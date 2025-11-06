// Script para agregar permisos de remisiones a roles existentes
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

async function addRemisionPermissions() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión establecida');

    console.log('📝 Agregando permisos de remisiones...');

    // Permisos de remisiones que vamos a agregar
    const remisionPermissions = [
      'remisiones.ver',
      'remisiones.crear', 
      'remisiones.editar',
      'remisiones.eliminar'
    ];

    // Obtener todos los roles
    const roles = await Role.find({});
    console.log(`📋 Encontrados ${roles.length} roles`);

    for (const role of roles) {
      console.log(`\n🔧 Procesando rol: ${role.name}`);
      
      let permissionsToAdd = [];
      
      // Agregar permisos según el tipo de rol
      if (role.name === 'admin' || role.name === 'Administrador') {
        // Admin tiene todos los permisos
        permissionsToAdd = [...remisionPermissions];
      } else if (role.name === 'vendedor' || role.name === 'Vendedor' || role.name === 'ventas') {
        // Vendedores pueden ver y crear remisiones
        permissionsToAdd = ['remisiones.ver', 'remisiones.crear'];
      } else if (role.name === 'supervisor' || role.name === 'Supervisor') {
        // Supervisores pueden ver, crear y editar
        permissionsToAdd = ['remisiones.ver', 'remisiones.crear', 'remisiones.editar'];
      } else {
        // Otros roles solo pueden ver
        permissionsToAdd = ['remisiones.ver'];
      }

      // Agregar solo los permisos que no existen
      let added = 0;
      for (const permission of permissionsToAdd) {
        if (!role.permissions.includes(permission)) {
          role.permissions.push(permission);
          added++;
        }
      }

      if (added > 0) {
        await role.save();
        console.log(`   ✅ Agregados ${added} permisos nuevos`);
        console.log(`   📜 Permisos agregados: ${permissionsToAdd.filter(p => !role.permissions.includes(p) || true).join(', ')}`);
      } else {
        console.log(`   ℹ️  No se agregaron permisos (ya existían)`);
      }
    }

    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log('📊 Resumen de permisos de remisiones agregados:');
    console.log('   - remisiones.ver: Ver lista de remisiones');
    console.log('   - remisiones.crear: Crear nuevas remisiones');
    console.log('   - remisiones.editar: Editar remisiones existentes');
    console.log('   - remisiones.eliminar: Eliminar remisiones');

  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
addRemisionPermissions();