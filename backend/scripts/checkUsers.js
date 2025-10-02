const mongoose = require('mongoose');
const User = require('../models/User');
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

const checkUsers = async () => {
  try {
    await connectDB();

    // Listar todos los usuarios
    const users = await User.find({}).populate('role', 'name permissions');
    
    console.log('👥 Usuarios encontrados:');
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos');
    } else {
      users.forEach(user => {
        console.log(`- ${user.username} (${user.email})`);
        console.log(`  Rol: ${user.role ? user.role.name : 'Sin rol'}`);
        if (user.role) {
          const cotizacionPerms = user.role.permissions.filter(p => p.includes('cotizaciones'));
          console.log(`  Permisos de cotizaciones: ${cotizacionPerms.join(', ')}`);
        }
        console.log('');
      });
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

checkUsers();