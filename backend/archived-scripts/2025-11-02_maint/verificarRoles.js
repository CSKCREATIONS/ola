const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('../models/Role');

async function verificarRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    const roles = await Role.find();
    console.log('📋 Roles existentes:');
    roles.forEach(role => {
      console.log(`- ${role.name} (enabled: ${role.enabled !== false})`);
      console.log(`  Permisos: ${role.permissions.length}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

verificarRoles();