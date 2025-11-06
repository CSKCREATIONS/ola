require('dotenv').config();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const { generatePedidoEmailHTML, renderPedidoEmailPreview } = require('../services/pdfService');

async function testPedidoHTML() {
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

    console.log(`🧪 Generando HTML para el pedido: ${pedido.numeroPedido}`);

    // Generar HTML del correo sin enviarlo
    const htmlContent = await generatePedidoEmailHTML(pedido);

    if (!htmlContent) {
      console.log('❌ No se pudo generar el HTML');
      return;
    }

    // Renderizar vista previa del HTML
    const previewHTML = renderPedidoEmailPreview(htmlContent);

    console.log('\n✅ Vista previa del HTML generada. Contenido acortado:');
    console.log(previewHTML.substring(0, 1000) + '...');

  } catch (error) {
    console.error('❌ Error probando HTML de pedido:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testPedidoHTML();