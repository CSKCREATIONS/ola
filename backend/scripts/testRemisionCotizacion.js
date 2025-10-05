// Script para probar que las remisiones muestran la referencia de la cotización
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Remision = require('../models/Remision');
const Cotizacion = require('../models/cotizaciones');

async function testRemisionConCotizacion() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar una remisión que tenga referencia de cotización
    console.log('\n🔍 Buscando remisiones con referencia de cotización...');
    const remisionConCotizacion = await Remision.findOne({ 
      cotizacionReferencia: { $exists: true, $ne: null } 
    })
    .populate('cotizacionReferencia', 'codigo')
    .populate('responsable', 'firstName surname');

    if (remisionConCotizacion) {
      console.log('✅ Remisión encontrada con referencia de cotización:');
      console.log(`   - Número de remisión: ${remisionConCotizacion.numeroRemision}`);
      console.log(`   - Código de pedido: ${remisionConCotizacion.codigoPedido}`);
      console.log(`   - Código de cotización: ${remisionConCotizacion.codigoCotizacion}`);
      console.log(`   - Cotización referenciada: ${remisionConCotizacion.cotizacionReferencia?.codigo || 'No disponible'}`);
      console.log(`   - Cliente: ${remisionConCotizacion.cliente?.nombre}`);
      console.log(`   - Total: S/. ${remisionConCotizacion.total?.toLocaleString('es-ES')}`);
    } else {
      console.log('⚠️  No se encontraron remisiones con referencia de cotización');
    }

    // Mostrar estadísticas
    console.log('\n📊 Estadísticas de remisiones:');
    const totalRemisiones = await Remision.countDocuments();
    const remisionesConCotizacion = await Remision.countDocuments({ 
      cotizacionReferencia: { $exists: true, $ne: null } 
    });
    
    console.log(`   - Total de remisiones: ${totalRemisiones}`);
    console.log(`   - Remisiones con referencia de cotización: ${remisionesConCotizacion}`);
    console.log(`   - Porcentaje: ${totalRemisiones > 0 ? ((remisionesConCotizacion / totalRemisiones) * 100).toFixed(1) : 0}%`);

    // Verificar que las cotizaciones remisionadas tengan el estado correcto
    console.log('\n🔍 Verificando cotizaciones remisionadas...');
    const cotizacionesRemisionadas = await Cotizacion.countDocuments({ estado: 'remisionado' });
    console.log(`   - Cotizaciones con estado "remisionado": ${cotizacionesRemisionadas}`);

    console.log('\n✅ Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el test
testRemisionConCotizacion();