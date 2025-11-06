// Script más simple para generar el HTML del email de pedido sin enviar
const mongoose = require('mongoose');
require('dotenv').config();
const Pedido = require('../models/Pedido');
const { generatePedidoEmailHTML } = require('../services/pdfService');

async function testPedidoHTMLSimple() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar el pedido más reciente
    const pedido = await Pedido.findOne().sort({ createdAt: -1 })
      .populate('productos.product')
      .populate('cliente')
      .populate('vendedor');

    if (!pedido) {
      console.log('❌ No se encontró ningún pedido');
      return;
    }

    console.log(`🧪 Generando HTML simple para el pedido: ${pedido.numeroPedido}`);

    // Generar HTML del correo sin enviarlo
    const htmlContent = await generatePedidoEmailHTML(pedido);

    if (!htmlContent) {
      console.log('❌ No se pudo generar el HTML');
      return;
    }

    console.log('\n✅ HTML generado correctamente. Vista previa acortada:');
    console.log(htmlContent.substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error probando HTML de pedido:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testPedidoHTMLSimple();