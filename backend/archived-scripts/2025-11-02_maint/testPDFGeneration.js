// testPDFGeneration.js
const mongoose = require('mongoose');
require('dotenv').config();
const Cotizacion = require('../models/cotizaciones');
const { generateCotizacionPDF } = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar la cotización más reciente
    const cotizacion = await Cotizacion.findOne().sort({ createdAt: -1 })
      .populate('productos.producto.id')
      .populate('cliente.referencia')
      .populate('vendedor');

    if (!cotizacion) {
      console.log('❌ No se encontró ninguna cotización');
      return;
    }

    console.log(`🧪 Generando PDF para la cotización: ${cotizacion.codigo}`);

    // Llamar al servicio para generar el PDF
    const pdfBuffer = await generateCotizacionPDF(cotizacion);

    if (!pdfBuffer) {
      console.log('❌ No se pudo generar el PDF');
      return;
    }

    // Guardar el PDF generado en la carpeta temporal del proyecto
    const outputDir = path.join(__dirname, '..', 'temp-pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `cotizacion_${cotizacion.codigo.replace(/\W+/g, '_')}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado y guardado en: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error probando generación de PDF:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testPDFGeneration();