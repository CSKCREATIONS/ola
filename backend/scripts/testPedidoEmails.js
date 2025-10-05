// Script de prueba para emails de pedidos
require('dotenv').config();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const Product = require('../models/Products');
const { 
  enviarPedidoAgendadoPorCorreo, 
  enviarPedidoDevueltoPorCorreo, 
  enviarPedidoCanceladoPorCorreo 
} = require('../controllers/pedidoControllers');

async function testPedidoEmails() {
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

    // Datos de prueba para el email
    const testData = {
      correoDestino: 'test@ejemplo.com', // Cambiar por un email real para probar
      asunto: 'Prueba de Email de Pedido',
      mensaje: 'Este es un mensaje de prueba del sistema de emails de pedidos.'
    };

    console.log('\n=== PROBANDO EMAILS DE PEDIDOS ===\n');

    // Test 1: Email de pedido agendado
    console.log('1️⃣ Probando email de pedido agendado...');
    try {
      const mockReq = {
        params: { id: pedido._id },
        body: testData
      };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`✅ Respuesta ${code}:`, data);
            return mockRes;
          }
        })
      };

      await enviarPedidoAgendadoPorCorreo(mockReq, mockRes);
    } catch (error) {
      console.log('❌ Error en email agendado:', error.message);
    }

    console.log('\n---\n');

    // Test 2: Email de pedido devuelto
    console.log('2️⃣ Probando email de pedido devuelto...');
    try {
      const mockReq = {
        params: { id: pedido._id },
        body: {
          ...testData,
          motivoDevolucion: 'Producto defectuoso - Prueba del sistema'
        }
      };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`✅ Respuesta ${code}:`, data);
            return mockRes;
          }
        })
      };

      await enviarPedidoDevueltoPorCorreo(mockReq, mockRes);
    } catch (error) {
      console.log('❌ Error en email devuelto:', error.message);
    }

    console.log('\n---\n');

    // Test 3: Email de pedido cancelado
    console.log('3️⃣ Probando email de pedido cancelado...');
    try {
      const mockReq = {
        params: { id: pedido._id },
        body: {
          ...testData,
          motivoCancelacion: 'Cancelación por parte del cliente - Prueba del sistema'
        }
      };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`✅ Respuesta ${code}:`, data);
            return mockRes;
          }
        })
      };

      await enviarPedidoCanceladoPorCorreo(mockReq, mockRes);
    } catch (error) {
      console.log('❌ Error en email cancelado:', error.message);
    }

    console.log('\n=== PRUEBAS COMPLETADAS ===');
    console.log('📧 Si tienes Gmail o SendGrid configurado, deberías haber recibido 3 emails de prueba');
    console.log('💡 Revisa la consola para ver los logs de envío');

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar las pruebas
testPedidoEmails();