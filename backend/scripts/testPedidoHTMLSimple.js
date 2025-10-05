// Script simplificado para probar la función HTML
const fs = require('fs');

// Datos de prueba simulados de un pedido
const pedidoMock = {
  numeroPedido: 'PED-00123',
  createdAt: new Date(),
  fechaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde hoy
  cliente: {
    nombre: 'Juan Pérez',
    correo: 'juan@ejemplo.com',
    telefono: '555-1234',
    direccion: 'Calle 123 #45-67',
    ciudad: 'Bogotá'
  },
  productos: [
    {
      product: {
        name: 'Laptop HP',
        codigo: 'LAP001'
      },
      cantidad: 2,
      precioUnitario: 1500000,
      descripcion: 'Laptop para oficina'
    },
    {
      product: {
        name: 'Mouse inalámbrico',
        codigo: 'MOU001'
      },
      cantidad: 2,
      precioUnitario: 50000
    }
  ],
  responsable: {
    firstName: 'María',
    surname: 'González'
  },
  observaciones: 'Entrega urgente para proyecto empresarial'
};

// Función copiada del controlador
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

function testHTMLContent() {
  console.log('=== PROBANDO GENERACIÓN DE HTML DE PEDIDO AGENDADO ===\n');

  // Generar HTML con mensaje personalizado
  const mensajePersonalizado = "Este es un mensaje específico para probar que el contenido es de PEDIDOS y no de cotizaciones.";
  const htmlContent = generarHTMLPedidoAgendado(pedidoMock, mensajePersonalizado);

  // Extraer información clave
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
  const h1Match = htmlContent.match(/<h1>(.*?)<\/h1>/);
  const documentoMatch = htmlContent.match(/Documento de (.*?) No\./);
  const messageMatch = htmlContent.match(/<h3>💬 Mensaje<\/h3>\s*<p>(.*?)<\/p>/s);

  console.log('📄 Título del documento:', titleMatch ? titleMatch[1] : 'No encontrado');
  console.log('🎯 Header principal:', h1Match ? h1Match[1] : 'No encontrado');
  console.log('📋 Tipo de documento:', documentoMatch ? documentoMatch[1] : 'No encontrado');
  console.log('💬 Mensaje:', messageMatch ? messageMatch[1].substring(0, 80) + '...' : 'No encontrado');

  // Verificar palabras problemáticas de cotización
  const palabrasCotizacion = [
    'cotización',
    'Cotización', 
    'COTIZACIÓN',
    'cotizada',
    'cotizado',
    'validez',
    'Productos Cotizados'
  ];

  console.log('\n=== VERIFICANDO CONTENIDO INCORRECTO (Cotizaciones) ===');
  let problemasEncontrados = [];
  palabrasCotizacion.forEach(palabra => {
    if (htmlContent.includes(palabra)) {
      problemasEncontrados.push(palabra);
      console.log(`❌ PROBLEMA: Encontrada palabra de cotización: "${palabra}"`);
    }
  });

  if (problemasEncontrados.length === 0) {
    console.log('✅ CORRECTO: No se encontraron palabras de cotización');
  }

  // Verificar palabras correctas de pedido
  const palabrasPedido = [
    'Pedido Agendado',
    'PEDIDO AGENDADO',
    'pedido',
    'agendado',
    'Productos Agendados'
  ];

  console.log('\n=== VERIFICANDO CONTENIDO CORRECTO (Pedidos) ===');
  let palabrasCorrectasEncontradas = [];
  palabrasPedido.forEach(palabra => {
    if (htmlContent.includes(palabra)) {
      palabrasCorrectasEncontradas.push(palabra);
      console.log(`✅ CORRECTO: Encontrada palabra de pedido: "${palabra}"`);
    }
  });

  if (palabrasCorrectasEncontradas.length === 0) {
    console.log('⚠️ ADVERTENCIA: No se encontraron palabras esperadas de pedido');
  }

  // Guardar HTML para inspección manual
  fs.writeFileSync('test_pedido_agendado.html', htmlContent);
  console.log('\n📁 HTML guardado en: test_pedido_agendado.html');

  // Resumen
  console.log('\n=== RESUMEN ===');
  if (problemasEncontrados.length === 0 && palabrasCorrectasEncontradas.length > 0) {
    console.log('✅ ÉXITO: El HTML de pedido agendado está correctamente generado');
  } else {
    console.log('❌ PROBLEMA: Se encontraron inconsistencias en el HTML');
    if (problemasEncontrados.length > 0) {
      console.log(`   - Palabras problemáticas: ${problemasEncontrados.join(', ')}`);
    }
    if (palabrasCorrectasEncontradas.length === 0) {
      console.log('   - No se encontraron palabras esperadas de pedido');
    }
  }
}

// Ejecutar la prueba
testHTMLContent();