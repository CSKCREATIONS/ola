// Script para simular el contenido del correo de remisión sin enviarlo
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Remision = require('../models/Remision');
const Pedido = require('../models/Pedido');

async function simulateEmailCall() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar una remisión reciente
    console.log('\n🔍 Buscando remisión reciente...');
    const remision = await Remision.findOne().sort({ createdAt: -1 });

    if (!remision) {
      console.log('❌ No se encontró ninguna remisión');
      return;
    }

    console.log(`✅ Remisión encontrada: ${remision.numeroRemision}`);

    // Simular contenido del correo
    console.log('\n📧 Simulación de contenido de correo:');
    console.log(`Asunto: Remisión ${remision.numeroRemision}`);
    console.log('Cuerpo:');
    console.log(`Estimado cliente,\n\nAdjuntamos la remisión ${remision.numeroRemision} correspondiente a su pedido.\n\nAtentamente,\nEquipo Pangea`);

    console.log('\n✅ Simulación completada');

  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la simulación
simulateEmailCall();