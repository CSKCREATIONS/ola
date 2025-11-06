const mongoose = require('mongoose');
require('dotenv').config();
const Cotizacion = require('../models/cotizaciones');
const { generateCotizacionPDF } = require('../services/pdfService');

async function testPDFGeneration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar la cotización más reciente
    const cotizacion = await Cotizacion.findOne()
      .sort({ createdAt: -1 })
      .populate('cliente.referencia');

    if (!cotizacion) {
      console.log('❌ No se encontró ninguna cotización');
      return;
    }

    console.log(`🧪 Probando PDF para la cotización: ${cotizacion.codigo}`);

    // Generar PDF sin enviar por correo
    const pdfBuffer = await generateCotizacionPDF(cotizacion);

    if (pdfBuffer) {
      console.log('✅ PDF generado correctamente. Tamaño:', pdfBuffer.length, 'bytes');
    } else {
      console.log('❌ No se generó el PDF');
    }

  } catch (error) {
    console.error('❌ Error probando PDF:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testPDFGeneration();