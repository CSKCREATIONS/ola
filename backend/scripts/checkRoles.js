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

const checkRoles = async () => {
  try {
    await connectDB();

    // Listar todos los roles
    const roles = await Role.find({});
    console.log('📋 Roles encontrados:');
    roles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role._id})`);
      console.log(`  Permisos relacionados con cotizaciones:`);
      const cotizacionPerms = role.permissions.filter(p => p.includes('cotizaciones'));
      cotizacionPerms.forEach(perm => console.log(`    - ${perm}`));
      console.log('');
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

checkRoles();