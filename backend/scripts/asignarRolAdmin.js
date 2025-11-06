const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

mongoose.connect('mongodb://localhost:27017/pangea')
  .then(async () => {
    console.log('✅ Conectado a MongoDB\n');
    
    // Buscar el rol Administrador
    const adminRole = await Role.findOne({ name: 'Administrador' });
    
    if (!adminRole) {
      console.log('❌ No se encontró el rol Administrador');
      mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Rol Administrador encontrado (ID: ${adminRole._id})`);
    console.log(`   Permisos: ${adminRole.permissions.length}\n`);
    
    // Asignar a natalia
    const user = await User.findOne({ username: 'natalia' });
    
    if (!user) {
      console.log('❌ No se encontró el usuario natalia');
      mongoose.disconnect();
      return;
    }
    
    user.role = adminRole._id;
    await user.save({ validateBeforeSave: false });
    
    console.log(`✅ Rol Administrador asignado a: ${user.username}`);
    console.log(`   Permisos otorgados: ${adminRole.permissions.length}`);
    console.log(`   Incluye roles.editar: ${adminRole.permissions.includes('roles.editar') ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   Incluye roles.crear: ${adminRole.permissions.includes('roles.crear') ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   Incluye roles.inhabilitar: ${adminRole.permissions.includes('roles.inhabilitar') ? 'SÍ ✅' : 'NO ❌'}`);
    
    mongoose.disconnect();
    console.log('\n🎉 Completado. Ahora cierra sesión y vuelve a entrar con el usuario natalia.');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  });
