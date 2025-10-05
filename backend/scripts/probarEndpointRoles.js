// Script para probar el endpoint de roles
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

// Importar modelos
const User = require('../models/User');
const Role = require('../models/Role');

async function probarEndpointRoles() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar un usuario administrador para generar token
    console.log('\n🔍 Buscando usuario administrador...');
    const adminUser = await User.findOne().populate('role');
    
    if (!adminUser) {
      console.log('❌ No se encontró ningún usuario en la base de datos');
      return;
    }

    console.log(`✅ Usuario encontrado: ${adminUser.username}`);
    console.log(`   - Rol: ${adminUser.role?.name || 'Sin rol'}`);
    console.log(`   - Permisos: ${adminUser.role?.permissions?.length || 0}`);

    // Generar token JWT
    const token = jwt.sign(
      { id: adminUser._id },
      config.secret,
      { expiresIn: '24h' }
    );

    console.log(`🔑 Token generado para pruebas`);

    // Simular petición al endpoint de roles
    console.log('\n🚀 Simulando petición al endpoint de roles...');
    
    const roleController = require('../controllers/roleController');
    
    // Mock request y response
    const mockReq = {
      headers: {
        'x-access-token': token
      },
      userId: adminUser._id,
      userRole: adminUser.role?.name,
      permissions: adminUser.role?.permissions || []
    };

    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`📤 Respuesta HTTP ${this.statusCode}:`);
        console.log(JSON.stringify(data, null, 2));
        return data;
      }
    };

    // Llamar directamente al controlador
    await roleController.getAllRoles(mockReq, mockRes);

    // También probar consultando directamente la base de datos
    console.log('\n🔍 Consulta directa a la base de datos:');
    const rolesDirect = await Role.find();
    console.log(`   - Roles encontrados: ${rolesDirect.length}`);
    
    const rolesFormatted = {
      success: true,
      roles: rolesDirect
    };
    
    console.log('\n📋 Formato esperado por el frontend:');
    console.log('data.roles =', rolesFormatted.roles.map(r => ({ 
      _id: r._id, 
      name: r.name, 
      enabled: r.enabled !== false 
    })));

    console.log('\n✅ Prueba del endpoint completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
probarEndpointRoles();