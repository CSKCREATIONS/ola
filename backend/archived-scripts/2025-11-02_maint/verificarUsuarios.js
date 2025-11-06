const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function verificarUsuarios() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    const users = await User.find();
    console.log('👤 Usuarios existentes:');
    users.forEach(u => {
      console.log(`- ${u.username} (${u.email}) - Activo: ${u.enabled !== false}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

verificarUsuarios();