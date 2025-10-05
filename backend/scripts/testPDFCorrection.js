// Script para verificar que el PDF de pedidos ya no muestre contenido de cotización
require('dotenv').config();
const mongoose = require('mongoose');
// Importar todos los modelos necesarios
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const Products = require('../models/Products');
const PDFService = require('../services/pdfService');

async function testPDFCorrection() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangea');
    console.log('📦 Conectado a MongoDB');

    // Buscar un pedido existente
    const pedido = await Pedido.findOne()
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      console.log('❌ No se encontraron pedidos para probar');
      return;
    }

    console.log('📋 Pedido encontrado:', {
      numero: pedido.numeroPedido,
      cliente: pedido.cliente?.nombre,
      productos: pedido.productos?.length,
      estado: pedido.estado
    });

    console.log('\n=== PROBANDO GENERACIÓN DE PDF DE PEDIDO AGENDADO ===');

    // Instanciar el servicio de PDF
    const pdfService = new PDFService();

    // Generar HTML del pedido
    console.log('📄 Generando HTML del pedido...');
    const htmlContent = pdfService.generarHTMLPedido(pedido, 'agendado');

    // Verificar contenido
    console.log('\n=== VERIFICACIÓN DEL CONTENIDO HTML ===');
    
    // Buscar palabras problemáticas de cotización
    const palabrasProblematicas = [
      'COTIZACIÓN',
      'cotización', 
      'Cotización',
      'pdf-cotizacion',
      'cotizacion-encabezado',
      'tabla-cotizacion',
      'Descripción de la cotización'
    ];

    let problemasEncontrados = [];
    palabrasProblematicas.forEach(palabra => {
      if (htmlContent.includes(palabra)) {
        problemasEncontrados.push(palabra);
      }
    });

    // Buscar palabras correctas de pedido
    const palabrasCorrectas = [
      'PEDIDO AGENDADO',
      'pdf-pedido',
      'pedido-encabezado', 
      'tabla-pedido',
      'Descripción del pedido'
    ];

    let palabrasCorrectasEncontradas = [];
    palabrasCorrectas.forEach(palabra => {
      if (htmlContent.includes(palabra)) {
        palabrasCorrectasEncontradas.push(palabra);
      }
    });

    // Mostrar resultados
    console.log('\n📊 RESULTADOS:');
    if (problemasEncontrados.length > 0) {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      problemasEncontrados.forEach(problema => {
        console.log(`   - ${problema}`);
      });
    } else {
      console.log('✅ Sin problemas de contenido de cotización');
    }

    if (palabrasCorrectasEncontradas.length > 0) {
      console.log('✅ CONTENIDO CORRECTO ENCONTRADO:');
      palabrasCorrectasEncontradas.forEach(correcta => {
        console.log(`   - ${correcta}`);
      });
    } else {
      console.log('⚠️ No se encontró contenido específico de pedido');
    }

    // Probar generación del PDF completo
    console.log('\n=== PROBANDO GENERACIÓN COMPLETA DEL PDF ===');
    try {
      const pdfData = await pdfService.generarPDFPedido(pedido, 'agendado');
      console.log('✅ PDF generado exitosamente:');
      console.log(`   - Nombre: ${pdfData.filename}`);
      console.log(`   - Tamaño: ${pdfData.buffer.length} bytes`);
      console.log(`   - Tipo: ${pdfData.contentType}`);
      
      // Verificar el nombre del archivo
      if (pdfData.filename.includes('Pedido_Agendado') && !pdfData.filename.includes('Cotizacion')) {
        console.log('✅ Nombre del archivo correcto');
      } else {
        console.log('❌ Problema en el nombre del archivo');
      }
    } catch (pdfError) {
      console.log('❌ Error generando PDF:', pdfError.message);
    }

    // Resumen final
    console.log('\n=== RESUMEN FINAL ===');
    if (problemasEncontrados.length === 0 && palabrasCorrectasEncontradas.length > 0) {
      console.log('🎉 ¡ÉXITO! El PDF de pedidos ahora está correctamente configurado');
      console.log('✅ Ya no contiene referencias a cotización');
      console.log('✅ Contiene el contenido correcto de pedido');
    } else {
      console.log('⚠️ Aún hay problemas que resolver:');
      if (problemasEncontrados.length > 0) {
        console.log('   - Contiene referencias a cotización');
      }
      if (palabrasCorrectasEncontradas.length === 0) {
        console.log('   - No contiene referencias a pedido');
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testPDFCorrection();