// Script para resetear la contraseña del usuario admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const Role = require('../models/Role');

async function resetearPasswordAdmin() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario admin
    console.log('\n🔍 Buscando usuario admin...');
    const adminUser = await User.findOne({ username: 'admin' }).populate('role');

    if (!adminUser) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${adminUser.username}`);
    console.log(`   - Nombre: ${adminUser.firstName} ${adminUser.surname}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Rol: ${adminUser.role?.name}`);
    console.log(`   - Habilitado: ${adminUser.enabled ? 'Sí' : 'No'}`);

    // Nueva contraseña
    const nuevaPassword = 'admin123';
    console.log(`\n🔄 Estableciendo nueva contraseña: ${nuevaPassword}`);

    // Hashear la nueva contraseña manualmente (el middleware pre-save no funciona en findOneAndUpdate)
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(adminUser._id, {
      password: hashedPassword,
      mustChangePassword: false, // Para que no pida cambiar la contraseña
      provisional: false
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('\n🎯 Credenciales de acceso:');
    console.log(`   - Usuario: admin`);
    console.log(`   - Contraseña: ${nuevaPassword}`);
    console.log('\n💡 Ahora puedes hacer login con estas credenciales');

    // Verificar que la contraseña se guardó correctamente
    const usuarioActualizado = await User.findById(adminUser._id).select('+password');
    const passwordValida = await bcrypt.compare(nuevaPassword, usuarioActualizado.password);
    
    if (passwordValida) {
      console.log('✅ Verificación: La nueva contraseña funciona correctamente');
    } else {
      console.log('❌ Error: La contraseña no se guardó correctamente');
    }

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el reseteo
resetearPasswordAdmin();