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

const addRemisionPermission = async () => {
  try {
    await connectDB();

    // Agregar nuevo permiso a roles que manejan ventas/pedidos
    const result = await Role.updateMany(
      { 
        name: { $in: ['Administrador', 'Vendedor'] }
      },
      {
        $addToSet: {
          permissions: 'pedidos.remisionar'
        }
      }
    );

    console.log(`✅ ${result.modifiedCount} roles actualizados con permiso pedidos.remisionar`);

    // Verificar los cambios
    const roles = await Role.find({ 
      name: { $in: ['Administrador', 'Vendedor'] }
    });

    console.log('\n📋 Permisos de pedidos actualizados:');
    roles.forEach(role => {
      const pedidoPerms = role.permissions.filter(p => p.includes('pedidos') || p.includes('ventas'));
      console.log(`${role.name}:`);
      pedidoPerms.forEach(perm => console.log(`  - ${perm}`));
      console.log('');
    });

    mongoose.disconnect();
    console.log('✅ Script completado');
  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

addRemisionPermission();