// Script para verificar remisiones en la base de datos
const mongoose = require('mongoose');
const Remision = require('./models/Remision');

async function verificarRemisiones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/pangea');
    console.log('✅ Conexión establecida');

    // Contar total de remisiones
    const total = await Remision.countDocuments();
    console.log(`📊 Total de remisiones en la BD: ${total}`);

    // Obtener algunas remisiones recientes
    const remisiones = await Remision.find({})
      .select('_id numeroRemision estado cliente.nombre fechaRemision')
      .sort({ fechaRemision: -1 })
      .limit(5);

    if (remisiones.length > 0) {
      console.log('\n📋 Últimas 5 remisiones:');
      remisiones.forEach((remision, index) => {
        console.log(`${index + 1}. ID: ${remision._id}`);
        console.log(`   Número: ${remision.numeroRemision}`);
        console.log(`   Cliente: ${remision.cliente?.nombre}`);
        console.log(`   Estado: ${remision.estado}`);
        console.log(`   Fecha: ${remision.fechaRemision}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron remisiones en la base de datos');
    }

    // Verificar específicamente el ID problemático
    const remisionProblematica = await Remision.findById('68ddc9890a5bc67d3ff72744');
    console.log(`🔍 Remisión con ID problemático (68ddc9890a5bc67d3ff72744): ${remisionProblematica ? 'EXISTE' : 'NO EXISTE'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

verificarRemisiones();