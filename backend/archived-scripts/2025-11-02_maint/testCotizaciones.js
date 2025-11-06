// Script para PDF pruebas
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Products = require('../models/Products');

async function testCotizaciones() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Probar 1: Cotizaciones recientes
    console.log('\n🔍 Cotizaciones recientes...');
    const cotizacionesRecientes = await Cotizacion.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('cliente.referencia', 'nombre correo telefono ciudad');

    console.log(`✅ Encontradas ${cotizacionesRecientes.length} cotizaciones recientes:`);
    cotizacionesRecientes.forEach((cot, idx) => {
      console.log(`\n${idx + 1}. Cotización: ${cot.codigo}`);
      console.log(`   - Estado: ${cot.estado}`);
      console.log(`   - Cliente: ${cot.cliente?.nombre || cot.cliente?.referencia?.nombre}`);
      console.log(`   - Productos: ${cot.productos?.length || 0}`);
      console.log(`   - Total: S/. ${cot.total?.toLocaleString('es-ES') || 'N/A'}`);
      console.log(`   - Fecha: ${cot.fecha ? new Date(cot.fecha).toLocaleDateString('es-ES') : 'N/A'}`);
    });

    // Probar 2: Estadísticas de estados
    console.log('\n📊 Estadísticas por estado:');
    const estados = ['pendiente', 'aprobada', 'rechazada', 'remisionado'];
    for (const estado of estados) {
      const count = await Cotizacion.countDocuments({ estado });
      console.log(`   - ${estado}: ${count}`);
    }

    // Probar 3: Cotizaciones aprobadas no remisionadas
    console.log('\n🔍 Cotizaciones aprobadas no remisionadas...');
    const aprobadasNoRemisionadas = await Cotizacion.find({ 
      estado: 'aprobada'
    }).limit(5);
    console.log(`   - Encontradas: ${aprobadasNoRemisionadas.length}`);

    console.log('\n✅ Pruebas completadas');

  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar pruebas
testCotizaciones();