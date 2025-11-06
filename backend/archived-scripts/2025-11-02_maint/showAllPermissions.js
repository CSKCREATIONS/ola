const mongoose = require('mongoose');
const Role = require('../models/Role');

require('dotenv').config();

async function showAllPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    const roles = await Role.find();
    const permissionsSet = new Set();

    roles.forEach(role => {
      role.permissions.forEach(p => permissionsSet.add(p));
    });

    console.log('📋 Permisos únicos en todos los roles:');
    Array.from(permissionsSet).sort().forEach(p => console.log(`- ${p}`));

  } catch (error) {
    console.error('❌ Error al listar permisos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

showAllPermissions();