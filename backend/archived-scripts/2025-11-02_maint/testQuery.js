const mongoose = require('mongoose');
require('dotenv').config();
const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const Products = require('../models/Products');

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Find recent pedidos
    const pedidos = await Pedido.find().sort({ createdAt: -1 }).limit(3)
      .populate('productos.product')
      .populate('cliente')
      .populate('vendedor');

    console.log('📦 Pedidos recientes:');
    pedidos.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.numeroPedido}`);
      console.log(`   - Cliente: ${p.cliente?.nombre}`);
      console.log(`   - Productos: ${p.productos?.length || 0}`);
      console.log(`   - Total: ${p.total || 'N/A'}`);
    });

    // Find cotizaciones with products
    const cotizaciones = await Cotizacion.find().sort({ createdAt: -1 }).limit(3)
      .populate('productos.producto.id')
      .populate('cliente.referencia');

    console.log('\n🧾 Cotizaciones recientes:');
    cotizaciones.forEach((c, idx) => {
      console.log(`\n${idx + 1}. ${c.codigo}`);
      console.log(`   - Cliente: ${c.cliente?.nombre || c.cliente?.referencia?.nombre}`);
      console.log(`   - Productos: ${c.productos?.length || 0}`);
      console.log(`   - Total: ${c.total || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error en consulta:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testQuery();