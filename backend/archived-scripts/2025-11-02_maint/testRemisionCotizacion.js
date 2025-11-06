// Script para buscar una cotización reciente y simular la remisión
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Products = require('../models/Products');

async function testRemisionCotizacion() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar una cotización disponible para remisionar
    console.log('\n🔍 Buscando cotización disponible...');
    const cotizacion = await Cotizacion.findOne({ 
      estado: { $ne: 'remisionado' }
    })
    .populate('cliente.referencia')
    .sort({ createdAt: -1 });

    if (!cotizacion) {
      console.log('❌ No se encontró ninguna cotización disponible para remisionar');
      return;
    }

    console.log(`✅ Cotización encontrada: ${cotizacion.codigo}`);
    console.log(`   - Cliente: ${cotizacion.cliente?.nombre || cotizacion.cliente?.referencia?.nombre}`);
    console.log(`   - Productos: ${cotizacion.productos?.length || 0}`);
    console.log(`   - Estado actual: ${cotizacion.estado}`);

    // Mostrar detalles de productos
    if (cotizacion.productos && cotizacion.productos.length > 0) {
      console.log('\n🧾 Detalle de productos:');
      cotizacion.productos.forEach((prod, idx) => {
        console.log(`  ${idx + 1}. ${prod.producto?.name || prod.nombre} - Cant: ${prod.cantidad} - Precio: ${prod.valorUnitario || prod.precioUnitario}`);
      });
    }

    console.log('\n✅ Prueba completada. La cotización está lista para remisionar.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testRemisionCotizacion();