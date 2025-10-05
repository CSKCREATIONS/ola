const mongoose = require('mongoose');
const Role = require('../models/Role');

// Configuración de conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pangea1');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const agregarPermisoRolesVer = async () => {
  try {
    await connectDB();

    // Buscar el rol de Administrador
    const adminRole = await Role.findOne({ name: 'Administrador' });
    if (!adminRole) {
      console.log('❌ No se encontró el rol de Administrador');
      return;
    }

    console.log('🔍 Verificando permisos actuales...');
    console.log(`📊 Permisos actuales: ${adminRole.permissions.length}`);
    
    // Verificar si ya tiene el permiso roles.ver
    if (adminRole.permissions.includes('roles.ver')) {
      console.log('✅ El rol Administrador ya tiene el permiso roles.ver');
      mongoose.disconnect();
      return;
    }

    // Agregar SOLO el permiso roles.ver
    console.log('➕ Agregando SOLO el permiso roles.ver...');
    
    const nuevosPermisos = [...adminRole.permissions, 'roles.ver'];
    
    await Role.findByIdAndUpdate(adminRole._id, {
      permissions: nuevosPermisos
    });

    console.log('✅ Permiso roles.ver agregado correctamente');
    console.log(`📊 Total de permisos ahora: ${nuevosPermisos.length}`);
    console.log('🎯 Esto permitirá renderizar RolesYPermisos.jsx');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

agregarPermisoRolesVer();