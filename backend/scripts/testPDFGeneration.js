const mongoose = require('mongoose');
const PDFService = require('../services/pdfService');
const Cotizacion = require('../models/cotizaciones');
const Pedido = require('../models/Pedido');
const Remision = require('../models/Remision');

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangea', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testPDFGeneration() {
  try {
    console.log('🧪 Iniciando pruebas de generación de PDFs...');

    // Crear instancia del servicio PDF
    const pdfService = new PDFService();

    // Datos de prueba para cotización
    const cotizacionPrueba = {
      _id: 'test-cotizacion-id',
      codigo: 'COT-0001',
      fecha: new Date(),
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      cliente: {
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        telefono: '+57 300 123 4567',
        ciudad: 'Bogotá'
      },
      productos: [
        {
          nombre: 'Laptop HP Pavilion',
          cantidad: 2,
          precioUnitario: 2500000,
          valorUnitario: 2500000,
          subtotal: 5000000,
          descripcion: 'Laptop para oficina con procesador Intel i5'
        },
        {
          nombre: 'Mouse inalámbrico',
          cantidad: 3,
          precioUnitario: 45000,
          valorUnitario: 45000,
          subtotal: 135000,
          descripcion: 'Mouse ergonómico con conexión Bluetooth'
        }
      ],
      total: 5135000,
      observaciones: 'Cotización válida por 30 días. Precios incluyen IVA.',
      estado: 'activa'
    };

    // Datos de prueba para pedido
    const pedidoPrueba = {
      _id: 'test-pedido-id',
      numeroPedido: 'PED-0001',
      createdAt: new Date(),
      fechaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      cliente: {
        nombre: 'María García',
        correo: 'maria.garcia@email.com',
        telefono: '+57 310 987 6543',
        ciudad: 'Medellín'
      },
      productos: [
        {
          nombre: 'Teclado mecánico',
          cantidad: 1,
          precioUnitario: 350000,
          descripcion: 'Teclado mecánico RGB para gaming'
        },
        {
          nombre: 'Monitor 24 pulgadas',
          cantidad: 2,
          precioUnitario: 800000,
          descripcion: 'Monitor Full HD IPS'
        }
      ],
      observacion: 'Entrega urgente solicitada por el cliente',
      estado: 'agendado'
    };

    // Datos de prueba para remisión
    const remisionPrueba = {
      _id: 'test-remision-id',
      numeroRemision: 'REM-0001',
      fechaRemision: new Date(),
      fechaEntrega: new Date(),
      cliente: {
        nombre: 'Carlos López',
        correo: 'carlos.lopez@email.com',
        telefono: '+57 320 456 7890',
        ciudad: 'Cali'
      },
      productos: [
        {
          nombre: 'Impresora multifuncional',
          cantidad: 1,
          precioUnitario: 1200000,
          total: 1200000,
          descripcion: 'Impresora láser a color con escáner'
        },
        {
          nombre: 'Papel bond tamaño carta',
          cantidad: 5,
          precioUnitario: 15000,
          total: 75000,
          descripcion: 'Resma de 500 hojas'
        }
      ],
      total: 1275000,
      observaciones: 'Productos entregados en perfecto estado',
      estado: 'entregado'
    };

    console.log('\n📄 Generando PDF de cotización...');
    try {
      const pdfCotizacion = await pdfService.generarPDFCotizacion(cotizacionPrueba);
      console.log('✅ PDF de cotización generado:', pdfCotizacion.filename);
      console.log('   Tamaño:', pdfCotizacion.buffer.length, 'bytes');
    } catch (error) {
      console.error('❌ Error generando PDF de cotización:', error.message);
    }

    console.log('\n📄 Generando PDF de pedido agendado...');
    try {
      const pdfPedido = await pdfService.generarPDFPedido(pedidoPrueba, 'agendado');
      console.log('✅ PDF de pedido agendado generado:', pdfPedido.filename);
      console.log('   Tamaño:', pdfPedido.buffer.length, 'bytes');
    } catch (error) {
      console.error('❌ Error generando PDF de pedido:', error.message);
    }

    console.log('\n📄 Generando PDF de pedido devuelto...');
    try {
      const pdfDevuelto = await pdfService.generarPDFPedido(pedidoPrueba, 'devuelto');
      console.log('✅ PDF de pedido devuelto generado:', pdfDevuelto.filename);
      console.log('   Tamaño:', pdfDevuelto.buffer.length, 'bytes');
    } catch (error) {
      console.error('❌ Error generando PDF de pedido devuelto:', error.message);
    }

    console.log('\n📄 Generando PDF de pedido cancelado...');
    try {
      const pdfCancelado = await pdfService.generarPDFPedido(pedidoPrueba, 'cancelado');
      console.log('✅ PDF de pedido cancelado generado:', pdfCancelado.filename);
      console.log('   Tamaño:', pdfCancelado.buffer.length, 'bytes');
    } catch (error) {
      console.error('❌ Error generando PDF de pedido cancelado:', error.message);
    }

    console.log('\n📄 Generando PDF de remisión...');
    try {
      const pdfRemision = await pdfService.generarPDFRemision(remisionPrueba);
      console.log('✅ PDF de remisión generado:', pdfRemision.filename);
      console.log('   Tamaño:', pdfRemision.buffer.length, 'bytes');
    } catch (error) {
      console.error('❌ Error generando PDF de remisión:', error.message);
    }

    console.log('\n🎉 Pruebas de generación de PDFs completadas');

  } catch (error) {
    console.error('💥 Error general en las pruebas:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar pruebas
testPDFGeneration();