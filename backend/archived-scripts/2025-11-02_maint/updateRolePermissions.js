require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

async function updateRolePermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    const roles = await Role.find();
    console.log(`📋 Roles encontrados: ${roles.length}`);

    // Agregar permisos de remisión
    const remisionPerms = ['remisiones.ver', 'remisiones.crear', 'remisiones.editar', 'remisiones.eliminar'];

    for (const role of roles) {
      const initialLength = role.permissions.length;
      remisionPerms.forEach(perm => {
        if (!role.permissions.includes(perm)) {
          role.permissions.push(perm);
        }
      });

      if (role.permissions.length > initialLength) {
        await role.save();
        console.log(`✅ Actualizado rol: ${role.name}`);
      }
    }

    console.log('🎉 Permisos de remisión agregados donde faltaban');

  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

updateRolePermissions();