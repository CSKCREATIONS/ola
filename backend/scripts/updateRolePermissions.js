const mongoose = require('mongoose');
const Role = require('../models/Role');

// Configuración de conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pangea', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const updateRolePermissions = async () => {
  try {
    await connectDB();

    // Actualizar rol Administrador - agregar nuevos permisos de cotizaciones
    await Role.findOneAndUpdate(
      { name: 'Administrador' },
      {
        $addToSet: {
          permissions: {
            $each: ['cotizaciones.enviar', 'cotizaciones.remisionar']
          }
        }
      }
    );

    // Actualizar rol Vendedor - agregar nuevos permisos de cotizaciones
    await Role.findOneAndUpdate(
      { name: 'Vendedor' },
      {
        $addToSet: {
          permissions: {
            $each: ['cotizaciones.enviar', 'cotizaciones.remisionar']
          }
        }
      }
    );

    console.log('✅ Permisos de roles actualizados correctamente');

    // Verificar los cambios
    const adminRole = await Role.findOne({ name: 'Administrador' });
    const vendedorRole = await Role.findOne({ name: 'Vendedor' });

    console.log('\n📋 Permisos del Administrador:');
    console.log(adminRole.permissions.filter(p => p.includes('cotizaciones')));

    console.log('\n📋 Permisos del Vendedor:');
    console.log(vendedorRole.permissions.filter(p => p.includes('cotizaciones')));

    mongoose.disconnect();
    console.log('\n✅ Script completado');
  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

updateRolePermissions();