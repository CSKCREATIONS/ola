require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    const username = process.argv[2] || 'admin';
    const newPassword = process.argv[3] || 'Admin123*';

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ Usuario ${username} no encontrado`);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Contraseña actualizada para el usuario ${username}`);

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

resetAdminPassword();