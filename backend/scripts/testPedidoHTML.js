// Script de prueba específico para verificar el HTML de pedidos
require('dotenv').config();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');

// Copiamos la función directamente para probarla
function generarHTMLPedidoAgendado(pedido, mensaje) {
  // Calcular totales
  const totalProductos = pedido.productos?.length || 0;
  const cantidadTotal = pedido.productos?.reduce((total, p) => total + (p.cantidad || 0), 0) || 0;
  const totalPedido = pedido.total || pedido.productos?.reduce((total, p) => total + ((p.cantidad || 0) * (p.precioUnitario || 0)), 0) || 0;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Agendado ${pedido.numeroPedido}</title>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ PEDIDO AGENDADO</h1>
          <p>Documento de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">AGENDADO</span>
        </div>

        <div class="content">
          <div class="info-grid">
            <div class="info-card">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
              <p><strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${pedido.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> ${pedido.cliente?.ciudad || 'N/A'}</p>
            </div>

            <div class="info-card">
              <h3>📋 Detalles del Pedido</h3>
              <p><strong>Fecha:</strong> ${new Date(pedido.createdAt).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Fecha de Entrega:</strong> ${pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Por definir'}</p>
              <p><strong>Estado:</strong> Agendado</p>
              <p><strong>Responsable:</strong> ${pedido.responsable?.firstName || ''} ${pedido.responsable?.surname || ''}</p>
              <p><strong>Items:</strong> ${totalProductos} productos</p>
              <p><strong>Cantidad Total:</strong> ${cantidadTotal} unidades</p>
            </div>
          </div>

          <div class="products-section">
            <h2 class="products-title">🛍️ Productos Agendados</h2>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio Unitario</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${pedido.productos?.map((producto, index) => `
                  <tr>
                    <td data-label="Producto:">
                      <strong>${producto.product?.name || producto.descripcion || 'Producto'}</strong>
                      ${producto.product?.codigo ? `<br><small style="color: #666;">Código: ${producto.product.codigo}</small>` : ''}
                    </td>
                    <td data-label="Cantidad:" style="text-align: center; font-weight: bold;">${producto.cantidad || 0}</td>
                    <td data-label="Precio Unit.:" style="text-align: right;">$${(producto.precioUnitario || 0).toLocaleString('es-ES')}</td>
                    <td data-label="Total:" style="text-align: right; font-weight: bold;">$${((producto.cantidad || 0) * (producto.precioUnitario || 0)).toLocaleString('es-ES')}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No hay productos</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="message-section">
            <h3>💬 Mensaje</h3>
            <p>${mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, nos complace informarle que su pedido ha sido agendado exitosamente y será procesado en las fechas indicadas. Encontrará adjunto el documento completo con los detalles de su pedido. Para cualquier consulta, no dude en contactarnos.`}</p>
          </div>

          ${pedido.observaciones ? `
          <div class="info-card" style="margin-top: 20px;">
            <h3>📝 Observaciones</h3>
            <p>${pedido.observaciones}</p>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p><strong>Pangea Sistemas</strong></p>
          <p>📧 contacto@empresa.com | 📞 Tel: (555) 123-4567</p>
          <p style="margin-top: 15px; font-size: 0.9em;">
            Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function testHTMLGeneration() {
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

    console.log('📋 Pedido encontrado:');
    console.log('   - Número:', pedido.numeroPedido);
    console.log('   - Cliente:', pedido.cliente?.nombre);
    console.log('   - Productos:', pedido.productos?.length);
    console.log('   - Estado:', pedido.estado);

    // Generar HTML
    const htmlContent = generarHTMLPedidoAgendado(pedido, "Este es un mensaje de prueba para verificar que el contenido es de pedidos y no de cotizaciones.");

    // Extraer solo el texto del title y los headers principales
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const h1Match = htmlContent.match(/<h1>(.*?)<\/h1>/);
    const messageMatch = htmlContent.match(/<h3>💬 Mensaje<\/h3>\s*<p>(.*?)<\/p>/);

    console.log('\n=== VERIFICACIÓN DEL HTML GENERADO ===');
    console.log('📄 Título:', titleMatch ? titleMatch[1] : 'No encontrado');
    console.log('🎯 Header:', h1Match ? h1Match[1] : 'No encontrado');
    console.log('💬 Mensaje:', messageMatch ? messageMatch[1].substring(0, 100) + '...' : 'No encontrado');

    // Verificar que no contenga texto de cotizaciones
    const contenidoCotizaciones = [
      'cotización',
      'Cotización',
      'COTIZACIÓN',
      'cotizada',
      'cotizado',
      'validez'
    ];

    console.log('\n=== VERIFICANDO CONTENIDO INCORRECTO ===');
    let encontradoProblema = false;
    contenidoCotizaciones.forEach(palabra => {
      if (htmlContent.toLowerCase().includes(palabra.toLowerCase())) {
        console.log(`❌ PROBLEMA: Encontrada palabra de cotización: "${palabra}"`);
        encontradoProblema = true;
      }
    });

    if (!encontradoProblema) {
      console.log('✅ CORRECTO: No se encontraron palabras de cotización en el HTML de pedido');
    }

    // Verificar palabras correctas de pedido
    const contenidoPedidos = [
      'pedido',
      'Pedido',
      'PEDIDO',
      'agendado',
      'AGENDADO'
    ];

    console.log('\n=== VERIFICANDO CONTENIDO CORRECTO ===');
    contenidoPedidos.forEach(palabra => {
      if (htmlContent.toLowerCase().includes(palabra.toLowerCase())) {
        console.log(`✅ CORRECTO: Encontrada palabra de pedido: "${palabra}"`);
      } else {
        console.log(`⚠️ ADVERTENCIA: No se encontró palabra esperada: "${palabra}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la prueba
testHTMLGeneration();