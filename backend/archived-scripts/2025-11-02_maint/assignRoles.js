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

const assignRoles = async () => {
  try {
    await connectDB();

    // Buscar el rol de Administrador
    const adminRole = await Role.findOne({ name: 'Administrador' });
    const vendedorRole = await Role.findOne({ name: 'Vendedor' });

    if (!adminRole || !vendedorRole) {
      console.log('❌ No se encontraron los roles necesarios');
      return;
    }

    // Asignar rol de Administrador al primer usuario
    const user1 = await User.findOne({ username: 'SENA2' });
    if (user1) {
      user1.role = adminRole._id;
      await user1.save();
      console.log(`✅ Asignado rol Administrador a ${user1.username}`);
    }

    // Asignar rol de Vendedor a otro usuario
    const user2 = await User.findOne({ username: 'juli2' });
    if (user2) {
      user2.role = vendedorRole._id;
      await user2.save();
      console.log(`✅ Asignado rol Vendedor a ${user2.username}`);
    }

    // Verificar los cambios
    const updatedUsers = await User.find({
      $or: [{ username: 'SENA2' }, { username: 'juli2' }]
    }).populate('role', 'name permissions');

    console.log('\n📋 Usuarios actualizados:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.username}: ${user.role ? user.role.name : 'Sin rol'}`);
      if (user.role) {
        const cotizacionPerms = user.role.permissions.filter(p => p.includes('cotizaciones'));
        console.log(`  Permisos de cotizaciones: ${cotizacionPerms.join(', ')}`);
      }
    });

    mongoose.disconnect();
    console.log('\n✅ Script completado');
  } catch (error) {
    console.error('❌ Error asignando roles:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

assignRoles();