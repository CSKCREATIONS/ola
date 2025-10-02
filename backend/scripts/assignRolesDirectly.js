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

const assignRolesDirectly = async () => {
  try {
    await connectDB();

    // Buscar roles existentes
    const adminRole = await Role.findOne({ name: 'Administrador' });
    const vendedorRole = await Role.findOne({ name: 'Vendedor' });

    if (!adminRole) {
      console.log('❌ No se encontró el rol Administrador');
      return;
    }

    if (!vendedorRole) {
      console.log('❌ No se encontró el rol Vendedor');
      return;
    }

    console.log(`📋 Roles encontrados:`);
    console.log(`- Administrador ID: ${adminRole._id}`);
    console.log(`- Vendedor ID: ${vendedorRole._id}`);

    // Actualizar directamente sin validación
    const result1 = await User.updateOne(
      { username: 'SENA2' },
      { $set: { role: adminRole._id } }
    );

    const result2 = await User.updateOne(
      { username: 'juli2' },
      { $set: { role: vendedorRole._id } }
    );

    console.log(`✅ Usuario SENA2: ${result1.modifiedCount > 0 ? 'Actualizado' : 'No encontrado'}`);
    console.log(`✅ Usuario juli2: ${result2.modifiedCount > 0 ? 'Actualizado' : 'No encontrado'}`);

    // Verificar los cambios
    const updatedUsers = await User.find({
      role: { $exists: true, $ne: null }
    }).populate('role', 'name permissions');

    console.log('\n📋 Usuarios con roles asignados:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email}): ${user.role.name}`);
      const cotizacionPerms = user.role.permissions.filter(p => p.includes('cotizaciones'));
      console.log(`  Permisos de cotizaciones: ${cotizacionPerms.join(', ')}`);
      console.log('');
    });

    mongoose.disconnect();
    console.log('✅ Script completado');
  } catch (error) {
    console.error('❌ Error asignando roles:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

assignRolesDirectly();