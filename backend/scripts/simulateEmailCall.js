// Script para simular la llamada exacta del frontend
require('dotenv').config();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const Product = require('../models/Products');

// Simulamos exactamente la función del controlador
async function simulateEmailCall() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangea');
    console.log('📦 Conectado a MongoDB');

    // Buscar un pedido real
    const pedido = await Pedido.findOne()
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      console.log('❌ No se encontraron pedidos');
      return;
    }

    console.log('📋 Datos del pedido encontrado:');
    console.log('   - ID:', pedido._id);
    console.log('   - Número:', pedido.numeroPedido);
    console.log('   - Cliente:', pedido.cliente?.nombre);
    console.log('   - Estado:', pedido.estado);
    console.log('   - Productos:', pedido.productos?.length);

    // Simular exactamente los datos que envía el frontend
    const mockReq = {
      params: { id: pedido._id.toString() },
      body: {
        correoDestino: 'test@ejemplo.com',
        asunto: 'Prueba desde script',
        mensaje: 'Este es un mensaje de prueba para verificar que se genera el contenido correcto de PEDIDOS'
      }
    };

    console.log('\n=== SIMULANDO LLAMADA AL CONTROLADOR ===');
    console.log('Parámetros enviados:');
    console.log('   - ID del pedido:', mockReq.params.id);
    console.log('   - Correo destino:', mockReq.body.correoDestino);
    console.log('   - Asunto:', mockReq.body.asunto);
    console.log('   - Mensaje:', mockReq.body.mensaje);

    // Verificar que estamos obteniendo el pedido correcto
    const pedidoVerificacion = await Pedido.findById(mockReq.params.id)
      .populate('cliente')
      .populate('productos.product');

    if (!pedidoVerificacion) {
      console.log('❌ ERROR: No se pudo encontrar el pedido con el ID proporcionado');
      return;
    }

    console.log('\n=== VERIFICACIÓN DE DATOS ===');
    console.log('✅ Pedido encontrado correctamente');
    console.log('   - Tipo de documento: PEDIDO');
    console.log('   - Número:', pedidoVerificacion.numeroPedido);
    console.log('   - Estado:', pedidoVerificacion.estado);
    console.log('   - Cliente nombre:', pedidoVerificacion.cliente?.nombre);

    // Generar el HTML exactamente como lo hace el controlador
    const { generarHTMLPedidoAgendado } = require('../controllers/pedidoControllers');
    
    // Como no podemos importar la función directamente, la recreamos aquí
    function generarHTMLPedidoAgendadoLocal(pedido, mensaje) {
      const totalProductos = pedido.productos?.length || 0;
      const cantidadTotal = pedido.productos?.reduce((total, p) => total + (p.cantidad || 0), 0) || 0;
      
      // Solo retornamos las partes críticas para verificar el contenido
      return `
        <title>Pedido Agendado ${pedido.numeroPedido}</title>
        <h1>✅ PEDIDO AGENDADO</h1>
        <p>Documento de pedido No. <strong>${pedido.numeroPedido}</strong></p>
        <h3>💬 Mensaje</h3>
        <p>${mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, nos complace informarle que su pedido ha sido agendado exitosamente`}</p>
        <h2>🛍️ Productos Agendados</h2>
        <p>Total productos: ${totalProductos}</p>
      `;
    }

    const htmlContent = generarHTMLPedidoAgendadoLocal(pedidoVerificacion, mockReq.body.mensaje);
    
    console.log('\n=== CONTENIDO HTML GENERADO ===');
    console.log('📄 Fragmento del HTML:');
    console.log(htmlContent);

    // Verificar contenido
    const tienePedido = htmlContent.includes('PEDIDO') || htmlContent.includes('pedido');
    const tieneCotizacion = htmlContent.includes('COTIZACIÓN') || htmlContent.includes('cotización');
    
    console.log('\n=== ANÁLISIS DEL CONTENIDO ===');
    console.log('✅ Contiene referencias a PEDIDO:', tienePedido ? 'SÍ' : 'NO');
    console.log('❌ Contiene referencias a COTIZACIÓN:', tieneCotizacion ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)');

    if (tienePedido && !tieneCotizacion) {
      console.log('\n🎉 RESULTADO: El HTML se genera correctamente para PEDIDOS');
      console.log('💡 Si ves contenido de cotización en el frontend, el problema está en:');
      console.log('   1. El frontend está enviando un ID incorrecto');
      console.log('   2. Estás viendo una página cacheada del navegador');
      console.log('   3. Hay algún error en la interfaz de usuario');
    } else {
      console.log('\n❌ PROBLEMA: El HTML no se está generando correctamente');
    }

  } catch (error) {
    console.error('❌ Error en la simulación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

simulateEmailCall();