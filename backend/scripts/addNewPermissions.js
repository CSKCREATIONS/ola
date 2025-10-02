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

const addNewPermissions = async () => {
  try {
    await connectDB();

    // Agregar nuevos permisos a roles existentes
    const result1 = await Role.updateMany(
      { 
        name: { $in: ['Administrador', 'Vendedor'] },
        permissions: { $in: ['cotizaciones.ver', 'cotizaciones.crear'] }
      },
      {
        $addToSet: {
          permissions: {
            $each: ['cotizaciones.enviar', 'cotizaciones.remisionar']
          }
        }
      }
    );

    console.log(`✅ ${result1.modifiedCount} roles actualizados`);

    // Verificar los cambios
    const roles = await Role.find({ 
      name: { $in: ['Administrador', 'Vendedor'] }
    });

    console.log('\n📋 Permisos de cotizaciones actualizados:');
    roles.forEach(role => {
      const cotizacionPerms = role.permissions.filter(p => p.includes('cotizaciones'));
      console.log(`${role.name}:`);
      cotizacionPerms.forEach(perm => console.log(`  - ${perm}`));
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

addNewPermissions();