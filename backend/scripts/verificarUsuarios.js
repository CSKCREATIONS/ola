// Script para verificar usuarios y credenciales
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const Role = require('../models/Role');

async function verificarUsuarios() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los usuarios
    console.log('\n🔍 Buscando usuarios en la base de datos...');
    const usuarios = await User.find().populate('role');

    if (usuarios.length > 0) {
      console.log(`✅ Se encontraron ${usuarios.length} usuarios:`);
      
      usuarios.forEach((usuario, index) => {
        console.log(`\n${index + 1}. Usuario: ${usuario.username}`);
        console.log(`   - Nombre: ${usuario.firstName} ${usuario.surname}`);
        console.log(`   - Email: ${usuario.email}`);
        console.log(`   - Habilitado: ${usuario.enabled ? 'Sí' : 'No'}`);
        console.log(`   - Rol: ${usuario.role?.name || 'Sin rol'}`);
        console.log(`   - Rol habilitado: ${usuario.role?.enabled !== false ? 'Sí' : 'No'}`);
        console.log(`   - Último login: ${usuario.lastLogin ? new Date(usuario.lastLogin).toLocaleString('es-ES') : 'Nunca'}`);
        console.log(`   - Debe cambiar contraseña: ${usuario.mustChangePassword ? 'Sí' : 'No'}`);
      });

      // Buscar un usuario administrador activo
      console.log('\n🔍 Buscando usuario administrador activo...');
      const adminUser = usuarios.find(u => 
        u.enabled && 
        u.role?.enabled !== false && 
        (u.role?.name?.toLowerCase().includes('admin') || u.role?.permissions?.length > 50)
      );

      if (adminUser) {
        console.log(`✅ Usuario administrador encontrado: ${adminUser.username}`);
        console.log(`   - Rol: ${adminUser.role.name}`);
        console.log(`   - Permisos: ${adminUser.role.permissions?.length || 0}`);
        
        console.log('\n💡 Puedes usar estas credenciales para hacer login:');
        console.log(`   - Usuario: ${adminUser.username}`);
        console.log(`   - (La contraseña debe coincidir con la que usaste al crear el usuario)`);
      } else {
        console.log('⚠️  No se encontró un usuario administrador activo');
      }

    } else {
      console.log('⚠️  No se encontraron usuarios en la base de datos');
      
      // Buscar roles disponibles
      const roles = await Role.find();
      if (roles.length > 0) {
        console.log('\n📋 Roles disponibles para crear usuario:');
        roles.forEach(role => {
          console.log(`   - ${role.name} (${role.enabled !== false ? 'Habilitado' : 'Deshabilitado'})`);
        });
      }
    }

    console.log('\n📊 Estadísticas:');
    const usuariosActivos = await User.countDocuments({ enabled: true });
    const usuariosInactivos = await User.countDocuments({ enabled: false });
    const rolesActivos = await Role.countDocuments({ enabled: { $ne: false } });
    
    console.log(`   - Usuarios activos: ${usuariosActivos}`);
    console.log(`   - Usuarios inactivos: ${usuariosInactivos}`);
    console.log(`   - Roles activos: ${rolesActivos}`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la verificación
verificarUsuarios();