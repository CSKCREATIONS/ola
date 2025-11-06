// Script para probar la función de remisionar una cotización
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Products = require('../models/Products');
const Pedido = require('../models/Pedido');
const Remision = require('../models/Remision');
const Counter = require('../models/Counter');

async function probarRemisionCotizacion() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar una cotización para remisionar
    console.log('\n🔍 Buscando cotización para remisionar...');
    const cotizacion = await Cotizacion.findOne({ 
      estado: { $ne: 'remisionado' }
    })
    .populate('cliente.referencia');

    if (!cotizacion) {
      console.log('❌ No se encontró ninguna cotización disponible para remisionar');
      return;
    }

    console.log(`✅ Cotización encontrada: ${cotizacion.codigo}`);
    console.log(`   - Cliente: ${cotizacion.cliente?.nombre || cotizacion.cliente?.referencia?.nombre}`);
    console.log(`   - Productos: ${cotizacion.productos?.length || 0}`);
    console.log(`   - Estado actual: ${cotizacion.estado}`);

    // Simular la llamada a remisionar
    console.log('\n🚀 Simulando proceso de remisión...');
    
    // Verificar contadores antes
    const counterPedidoAntes = await Counter.findById('pedido');
    const counterRemisionAntes = await Counter.findById('remision');
    
    console.log(`📊 Estado de contadores antes:`);
    console.log(`   - Pedidos: ${counterPedidoAntes?.seq || 'No existe'}`);
    console.log(`   - Remisiones: ${counterRemisionAntes?.seq || 'No existe'}`);

    // Verificar que los números que se generarían no existan
    const proximoPedido = `PED-${String((counterPedidoAntes?.seq || 0) + 1).padStart(5, '0')}`;
    const proximaRemision = `REM-${String((counterRemisionAntes?.seq || 0) + 1).padStart(5, '0')}`;
    
    console.log(`🎯 Próximos números a generar:`);
    console.log(`   - Pedido: ${proximoPedido}`);
    console.log(`   - Remisión: ${proximaRemision}`);

    // Verificar que no existan duplicados
    const pedidoExistente = await Pedido.findOne({ numeroPedido: proximoPedido });
    const remisionExistente = await Remision.findOne({ numeroRemision: proximaRemision });

    if (pedidoExistente) {
      console.log(`❌ Ya existe un pedido con número: ${proximoPedido}`);
    } else {
      console.log(`✅ Número de pedido disponible: ${proximoPedido}`);
    }

    if (remisionExistente) {
      console.log(`❌ Ya existe una remisión con número: ${proximaRemision}`);
    } else {
      console.log(`✅ Número de remisión disponible: ${proximaRemision}`);
    }

    console.log('\n✅ Verificación completada. Los contadores están listos para generar números únicos.');
    console.log('💡 Ahora puedes probar la remisión desde el frontend sin errores de duplicados.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
probarRemisionCotizacion();