// controllers/pedidoController.js
const Pedido = require('../models/Pedido');
const Product = require('../models/Products'); // para calcular precios
const Cotizacion = require('../models/cotizaciones');
const Counter = require('../models/Counter');
const Cliente = require('../models/Cliente');
const Remision = require('../models/Remision');
const Venta = require('../models/venta');
const PDFService = require('../services/pdfService');
const { enviarCorreoGmail } = require('../utils/gmailSender');
const { enviarCorreoSendGrid } = require('../utils/emailSender');
const mongoose = require('mongoose');

// Helper: sanitizar IDs para prevenir inyección NoSQL
function sanitizarId(id) {
  if (!id) return null;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  return null;
}

// Helper centralizado: enviar correo con attachment (Gmail primero, SendGrid fallback)
async function enviarCorreoConAttachment(destinatario, asunto, htmlContent, pdfAttachment = null) {
  const attachments = pdfAttachment ? [pdfAttachment] : [];
  
  try {
    console.log('📧 Intentando enviar con Gmail...');
    await enviarCorreoGmail(destinatario, asunto, htmlContent, attachments);
    console.log('✅ Correo enviado exitosamente con Gmail');
  } catch (errorGmail) {
    console.warn('⚠️ Gmail falló, intentando con SendGrid...', errorGmail.message);
    try {
      await enviarCorreoSendGrid(destinatario, asunto, htmlContent, attachments);
      console.log('✅ Correo enviado exitosamente con SendGrid (fallback)');
    } catch (errorSendGrid) {
      console.error('❌ Ambos servicios de email fallaron');
      throw new Error(`Gmail: ${errorGmail.message}. SendGrid: ${errorSendGrid.message}`);
    }
  }
}

// Helper: generar attachment PDF para pedido (delegado a PDFService)
async function generatePdfAttachmentForPedido(pedido, tipo = 'agendado') {
  try {
    const pdfService = new PDFService();
    const pdfData = await pdfService.generarPDFPedido(pedido, tipo);
    return {
      filename: pdfData.filename,
      content: pdfData.buffer,
      contentType: pdfData.contentType
    };
  } catch (error) {
    console.error('⚠️ Error generando PDF attachment:', error.message);
    return null;
  }
}

// Helper: construir objeto remisión para generación de PDF
function buildRemisionPdfData(pedido, numeroRemision, options = {}) {
  const { observaciones, fechaEntrega, codigoCotizacion } = options;
  const cantidadItems = pedido.productos?.reduce((total, p) => total + (Number(p.cantidad) || 0), 0) || 0;
  
  // Inferir codigoCotizacion si no se provee explícitamente
  let cotizacionCodigo = codigoCotizacion;
  if (!cotizacionCodigo && pedido.cotizacionReferenciada) {
    if (typeof pedido.cotizacionReferenciada === 'object' && pedido.cotizacionReferenciada.codigoCotizacion) {
      cotizacionCodigo = pedido.cotizacionReferenciada.codigoCotizacion;
    } else if (pedido.cotizacionCodigo) {
      cotizacionCodigo = pedido.cotizacionCodigo;
    }
  }
  
  return {
    numeroRemision: numeroRemision || pedido.numeroPedido,
    pedido: pedido.numeroPedido || 'N/A',
    cliente: pedido.cliente,
    productos: pedido.productos || [],
    cantidadItems,
    observaciones: observaciones || '',
    fecha: new Date(),
    fechaEntrega: fechaEntrega || pedido.fechaEntrega || new Date(),
    codigoCotizacion: cotizacionCodigo || undefined
  };
}

function generarHTMLRemision(pedido, numeroRemision, mensaje = '') {
  const pdfSrv = new PDFService();
  const remisionData = buildRemisionPdfData(pedido, numeroRemision, { observaciones: mensaje, fechaEntrega: pedido.fechaEntrega });
  return pdfSrv.generarHTMLRemision(remisionData);
}





// === FUNCIONES NUEVAS DE ENVÍO DE CORREO ===

// Enviar pedido por correo (general) - implementación delegada y simple
exports.enviarPedidoPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body || {};

    // Sanitizar el ID para prevenir inyección NoSQL
    const pedidoId = sanitizarId(req.params.id);
    if (!pedidoId) return res.status(400).json({ message: 'ID de pedido inválido' });

    console.log('🔍 Iniciando envío de correo para pedido:', pedidoId);

    // Obtener el pedido con relaciones necesarias
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    const destinatario = correoDestino || pedido.cliente?.correo;
    const asuntoFinal = asunto || `Pedido Agendado ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    const mensajeFinal = mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, le enviamos la confirmación de su pedido agendado ${pedido.numeroPedido}.`;

    // Generar HTML
    const htmlContent = generarHTMLPedidoAgendado(pedido, mensajeFinal);

    // Intentar generar PDF (no fatal) - delegado a helper
    let pdfAttachment = await generatePdfAttachmentForPedido(pedido, 'agendado');

    // Delegar envío al helper centralizado (maneja Gmail/SendGrid/errores)
    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    // Marcar como enviado (intento no-fatal)
    try {
      await Pedido.findByIdAndUpdate(pedidoId, { enviadoCorreo: true });
    } catch (error_) {
      console.warn('⚠️ No se pudo marcar pedido como enviado:', error_?.message || error_);
    }

    return res.status(200).json({
      message: 'Pedido enviado por correo exitosamente',
      destinatario,
      asunto: asuntoFinal,
      pdfAdjunto: !!pdfAttachment
    });

  } catch (error) {
    console.error('❌ Error al enviar pedido por correo:', error);
    return res.status(500).json({ message: 'Error al enviar pedido por correo', error: error?.message || String(error) });
  }
};

// Enviar remisi�n por correo
exports.enviarRemisionPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body;
    
    // Sanitizar el ID para prevenir inyección NoSQL
    const pedidoId = sanitizarId(req.params.id);
    if (!pedidoId) {
      return res.status(400).json({ message: 'ID de pedido inválido' });
    }
    
    console.log('🔍 Iniciando envío de remisión por correo:', pedidoId);
    console.log('📧 Datos de envío:', { correoDestino, asunto });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente.correo;
    const asuntoFinal = asunto || `Remisión - Pedido ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    
    // Generar número de remisión si no existe
    const numeroRemision = `REM-${pedido.numeroPedido}-${Date.now().toString().slice(-6)}`;
    
    // Generar HTML profesional de la remisión
    const htmlContent = generarHTMLRemision(pedido, numeroRemision, mensaje);
    
    // Generar PDF de la remisión
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la remisión...');
      const pdfService = new PDFService();
      
      // Crear objeto remisión para el PDF (centralizado)
      const remisionData = buildRemisionPdfData(pedido, numeroRemision);
      
      const pdfData = await pdfService.generarPDFRemision(remisionData);
      pdfAttachment = {
        filename: pdfData.filename,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF generado exitosamente:', pdfData.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError.message);
      // Continuar sin PDF si hay error
    }

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.json({ message: 'Remisión enviada por correo exitosamente' });
  } catch (error) {
    console.error('❌ Error al enviar remisión por correo:', error);
    res.status(500).json({ message: 'Error al enviar remisión por correo', error: error.message });
  }
};

// Enviar remisión formal por correo
exports.enviarRemisionFormalPorCorreo = async (req, res) => {
  try {
    const { numeroRemision, correoDestino, asunto, mensaje } = req.body;
    
    // Sanitizar el ID para prevenir inyección NoSQL
    const pedidoId = sanitizarId(req.params.id);
    if (!pedidoId) {
      return res.status(400).json({ message: 'ID de pedido inválido' });
    }
    
    console.log('🔍 Iniciando envío de remisión formal por correo:', pedidoId);
    console.log('📧 Datos de envío:', { correoDestino, asunto, numeroRemision });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente.correo;
    const asuntoFinal = asunto || `Remisión Formal ${numeroRemision || pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    
    // Generar número de remisión formal si no se proporciona
    const numeroRemisionFinal = numeroRemision || `RF-${pedido.numeroPedido}-${Date.now().toString().slice(-6)}`;
    
    // Generar HTML profesional de la remisión formal
    const htmlContent = generarHTMLRemision(pedido, numeroRemisionFinal, mensaje);
    
    // Generar PDF de la remisión formal
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la remisión formal...');
      const pdfService = new PDFService();
      
      // Crear objeto remisión formal para el PDF (centralizado)
      const remisionFormalData = buildRemisionPdfData(pedido, numeroRemisionFinal, { observaciones: mensaje });
      
      const pdfData = await pdfService.generarPDFRemision(remisionFormalData);
      pdfAttachment = {
        filename: `remision-formal-${numeroRemisionFinal.replaceAll(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF de remisión formal generado exitosamente:', pdfAttachment.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF de remisión formal:', pdfError.message);
      // Continuar sin PDF si hay error
    }

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.json({ message: 'Remisión formal enviada por correo exitosamente' });
  } catch (error) {
    console.error('❌ Error al enviar remisión formal por correo:', error);
    res.status(500).json({ message: 'Error al enviar remisión formal por correo', error: error.message });
  }
};

// Función para probar la configuración de email
exports.testEmailConfiguration = async (req, res) => {
  try {
    console.log('🧪 Iniciando prueba de configuración de email...');
    
    const testEmail = req.body.email || 'test@example.com';
    const asunto = 'Prueba de configuración de email - Pangea';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Prueba de Configuración de Email</h2>
        <p>Este es un email de prueba para verificar la configuración del sistema.</p>
        <p><strong>Hora de prueba:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p><strong>Estado:</strong> ✅ Email enviado exitosamente</p>
      </div>
    `;

    await enviarCorreoConAttachment(testEmail, asunto, htmlContent, null);

    res.json({ 
      success: true,
      message: 'Email de prueba enviado exitosamente',
      timestamp: new Date().toISOString(),
      emailDestino: testEmail
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar email de prueba', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};



// Función para generar HTML profesional de pedidos agendados (delegado a PDFService)
function generarHTMLPedidoAgendado(pedido, mensaje = '') {
  const pdfSrv = new PDFService();
  return pdfSrv.generarHTMLPedido(pedido, 'agendado');
}

// Kept for historical reference (now replaced by delegated PDFService call):
// Previously contained a large inline HTML template (removed to centralize HTML generation)

function _LEGACY_generarHTMLPedidoAgendado(pedido, mensaje = '') {
  const totalCalculado = pedido.productos.reduce((total, producto) => {
    const precio = Number(producto.precioUnitario) || Number(producto.product?.price) || 0;
    const cantidad = Number(producto.cantidad) || 0;
    return total + (precio * cantidad);
  }, 0);
  
  const cantidadTotal = pedido.productos.reduce((total, producto) => {
    return total + (Number(producto.cantidad) || 0);
  }, 0);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Agendado ${pedido.numeroPedido}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f8f9fa;
          margin: 0;
          padding: 10px;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 10px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #fd7e14, #e8590c); 
          color: white; 
          padding: 20px; 
          text-align: center; 
        }
        .header h1 { 
          font-size: 2em; 
          margin-bottom: 10px; 
          font-weight: 300; 
        }
        .header p { 
          font-size: 1em; 
          opacity: 0.9; 
        }
        .status-badge { 
          background: rgba(255,255,255,0.2); 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 0.9em; 
          font-weight: bold; 
          margin-top: 10px; 
          display: inline-block; 
          border: 2px solid rgba(255,255,255,0.3); 
          color: white; 
        }
        .content { 
          padding: 20px; 
        }
        .info-grid { 
          display: block;
          margin-bottom: 20px; 
        }
        .info-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #fd7e14; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #fd7e14; 
          margin-bottom: 10px; 
          font-size: 1.1em; 
        }
        .info-card p { 
          margin-bottom: 5px; 
          color: #555; 
          font-size: 0.9em;
        }
        .info-card strong { 
          color: #333; 
        }
        .products-section { 
          margin: 20px 0; 
        }
        .products-title { 
          background: #fd7e14; 
          color: white; 
          padding: 15px; 
          margin-bottom: 0; 
          border-radius: 8px 8px 0 0; 
          font-size: 1.2em; 
        }
        
        /* Mobile-first table design */
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
          border-radius: 0 0 8px 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        
        /* Hide table headers on mobile */
        .products-table thead { 
          display: none; 
        }
        
        .products-table tfoot {
          display: none;
        }
        
        .products-table tr { 
          display: block; 
          border: 1px solid #eee; 
          margin-bottom: 10px; 
          border-radius: 8px; 
          background: white; 
          padding: 10px; 
        }
        
        .products-table td { 
          display: block; 
          text-align: left !important; 
          padding: 5px 0; 
          border: none; 
          position: relative; 
          padding-left: 120px; 
        }
        
        .products-table td:before { 
          content: attr(data-label); 
          position: absolute; 
          left: 0; 
          width: 110px; 
          font-weight: bold; 
          color: #fd7e14; 
          font-size: 0.9em; 
        }
        
        .total-row { 
          background: #fff3e0 !important; 
          font-weight: bold; 
          border: 2px solid #fd7e14 !important; 
        }
        
        .total-row td { 
          color: #fd7e14; 
          font-size: 1.1em; 
        }
        
        .total-row td:before { 
          color: #fd7e14; 
        }
        
        /* Mobile total summary */
        .mobile-total {
          display: block;
          background: linear-gradient(135deg, #fd7e14, #e8590c);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
          font-size: 1.2em;
          font-weight: bold;
        }
        
        .alert-section { 
          background: linear-gradient(135deg, #17a2b8, #138496); 
          color: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .alert-section h3 { 
          margin-bottom: 10px; 
          font-size: 1.2em; 
        }
        .alert-section p { 
          font-size: 1em; 
          line-height: 1.6; 
        }
        .message-section { 
          background: linear-gradient(135deg, #6f42c1, #5a31a8); 
          color: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .message-section h3 { 
          margin-bottom: 10px; 
          font-size: 1.2em; 
        }
        .message-section p { 
          font-size: 1em; 
          line-height: 1.6; 
        }
        .footer { 
          background: #343a40; 
          color: #adb5bd; 
          padding: 20px; 
          text-align: center; 
        }
        .footer p { 
          margin-bottom: 5px; 
          font-size: 0.9em; 
        }
        
        /* Desktop styles */
        @media (min-width: 768px) { 
          body { 
            padding: 20px; 
          }
          .header h1 { 
            font-size: 2.5em; 
          }
          .header p { 
            font-size: 1.2em; 
          }
          .container { 
            margin: 20px auto; 
          }
          .content { 
            padding: 30px; 
          }
          .info-grid { 
            display: block; 
            margin-bottom: 30px; 
          }
          .info-card { 
            padding: 20px; 
            margin-bottom: 20px; 
          }
          .info-card h3 { 
            font-size: 1.3em; 
          }
          .info-card p { 
            font-size: 1em; 
          }
          .products-title { 
            padding: 20px; 
            font-size: 1.3em; 
          }
          
          /* Desktop table styles */
          .products-table thead { 
            display: table-header-group; 
          }
          .products-table tfoot { 
            display: table-footer-group; 
          }
          .products-table tr { 
            display: table-row; 
            border: none; 
            margin: 0; 
            padding: 0; 
            background: transparent; 
          }
          .products-table th, 
          .products-table td { 
            display: table-cell; 
            padding: 12px; 
            border-bottom: 1px solid #eee; 
            text-align: left; 
            position: static; 
          }
          .products-table th { 
            background: #fd7e14; 
            color: white; 
            font-weight: bold; 
            text-align: center; 
          }
          .products-table td { 
            padding-left: 12px; 
          }
          .products-table td:before { 
            display: none; 
          }
          .products-table td:nth-child(2), 
          .products-table td:nth-child(3), 
          .products-table td:nth-child(4) { 
            text-align: center; 
          }
          .products-table .total-row { 
            background: #fff3e0 !important; 
            border-top: 3px solid #fd7e14; 
            font-size: 1.1em; 
          }
          .alert-section { 
            padding: 25px; 
          }
          .alert-section h3 { 
            font-size: 1.3em; 
          }
          .alert-section p { 
            font-size: 1.1em; 
          }
          .message-section { 
            padding: 25px; 
          }
          .message-section h3 { 
            font-size: 1.3em; 
          }
          .message-section p { 
            font-size: 1.1em; 
          }
          .footer { 
            padding: 25px; 
          }
          .footer p { 
            font-size: 1em; 
          }
          .status-badge { 
            font-size: 0.9em; 
          }
          
          .mobile-total {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📅 PEDIDO AGENDADO</h1>
          <p>Confirmación de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">${pedido.estado?.toUpperCase() || 'AGENDADO'}</span>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Cliente -->
            <div class="info-card">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
              <p><strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${pedido.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> ${pedido.cliente?.ciudad || 'N/A'}</p>
            </div>

            <!-- Información del Pedido -->
            <div class="info-card">
              <h3>📋 Detalles del Pedido</h3>
              <p><strong>Número de Pedido:</strong> ${pedido.numeroPedido}</p>
              <p><strong>Fecha de Entrega:</strong> ${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> <span style="color: #fd7e14; font-weight: bold;">${(pedido.estado?.toUpperCase()) || 'AGENDADO'}</span></p>
              <p><strong>Cantidad Total de Productos:</strong> ${cantidadTotal} unidades</p>
              ${pedido.cotizacionCodigo ? '<p><strong>Cotización de Referencia:</strong> ' + pedido.cotizacionCodigo + '</p>' : ''}
            </div>
          </div>

          <!-- Alert Section para pedidos agendados -->
          <div class="alert-section">
            <h3>⏰ Información Importante</h3>
            <p>Su pedido ha sido <strong>agendado</strong> para entrega el <strong>${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</strong>. Nos estaremos comunicando con usted próximamente para coordinar los detalles de la entrega. Por favor mantenga este número de pedido como referencia: <strong>${pedido.numeroPedido}</strong>.</p>
          </div>

          <!-- Products Section -->
          <div class="products-section">
            <div class="products-title">
              🛒 Productos Incluidos (${cantidadTotal} unidades)
            </div>
            <table class="products-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Producto</th>
                  <th style="width: 15%;">Cantidad</th>
                  <th style="width: 20%;">Precio Unit.</th>
                  <th style="width: 25%;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${pedido.productos.map(producto => {
                  const precio = Number(producto.precioUnitario) || Number(producto.product?.price) || 0;
                  const cantidad = Number(producto.cantidad) || 0;
                  const subtotal = precio * cantidad;
                  
                  return `
                    <tr>
                      <td data-label="Producto:">
                        <strong>${producto.product?.name || producto.product?.nombre || 'Producto no encontrado'}</strong>
                        ${producto.product?.description ? '<br><small style="color: #666;">' + producto.product.description + '</small>' : ''}
                      </td>
                      <td data-label="Cantidad:">${cantidad}</td>
                      <td data-label="Precio Unit.:">S/. ${precio.toLocaleString('es-ES')}</td>
                      <td data-label="Subtotal:">S/. ${subtotal.toLocaleString('es-ES')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="" style="text-align: left; font-weight: bold;">TOTAL GENERAL</td>
                  <td data-label="">${cantidadTotal}</td>
                  <td data-label=""></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>S/. ${totalCalculado.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Mobile Total Summary -->
            <div class="mobile-total">
              💰 Total General: S/. ${totalCalculado.toLocaleString('es-ES')}
            </div>
          </div>

          <!-- Message Section -->
          ${mensaje ? 
          '<div class="message-section">' +
            '<h3>💬 Mensaje Adicional</h3>' +
            '<p>' + mensaje + '</p>' +
          '</div>'
          : 
          '<div class="message-section">' +
            '<h3>📝 Próximos Pasos</h3>' +
            '<p>Estimado/a ' + (pedido.cliente?.nombre || 'Cliente') + ', su pedido ' + pedido.numeroPedido + ' ha sido confirmado y agendado exitosamente. Nuestro equipo se pondrá en contacto con usted antes de la fecha de entrega para coordinar todos los detalles. Agradecemos su confianza en nuestros servicios.</p>' +
          '</div>'
          }

          ${pedido.observacion ? 
          '<div class="info-card" style="margin-top: 20px;">' +
            '<h3>📝 Observaciones</h3>' +
            '<p>' + pedido.observacion + '</p>' +
          '</div>'
          : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>${process.env.COMPANY_NAME || 'JLA Global Company'}</strong></p>
          <p>📧 ${process.env.GMAIL_USER || process.env.SENDGRID_FROM_EMAIL || 'contacto@empresa.com'} | 📞 ${process.env.COMPANY_PHONE || 'Tel: (555) 123-4567'}</p>
          <p style="margin-top: 15px; font-size: 0.9em;">
            Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

