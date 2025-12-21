const Remision = require('../models/Remision');
const Pedido = require('../models/Pedido');
const Counter = require('../models/Counter');
const PDFService = require('../services/pdfService');
const sgMail = require('@sendgrid/mail');
const emailSender = require('../utils/emailSender');
const { normalizeProducto, calcularTotales } = require('../utils/normalize');
const { isValidEmail } = require('../utils/validators');

const sanitizarId = (id) => {
  const idSanitizado = typeof id === 'string' ? id.trim() : '';
  // Use RegExp.exec for deterministic behavior (avoids returning arrays like String.match)
  if (!/^[0-9a-fA-F]{24}$/.exec(idSanitizado)) {
    return null;
  }
  return idSanitizado;
};


async function fetchRemisionOrThrow(id) {
  // Validate id early to avoid costly DB lookups with invalid input
  const idStr = typeof id === 'string' ? id.trim() : '';
  // Use exec for deterministic regex validation
  if (!/^[0-9a-fA-F]{24}$/.exec(idStr)) {
    const err = new Error('ID inválido para remisión');
    err.code = 'INVALID_ID';
    throw err;
  }

  const remision = await Remision.findById(idStr)
    .populate('responsable', 'username firstName surname')
    .populate('cotizacionReferencia', 'codigo')
    .populate('cliente', 'nombre correo telefono ciudad');
  if (!remision) {
    const err = new Error('Remisión no encontrada');
    err.code = 'REMISION_NOT_FOUND';
    throw err;
  }
  return remision;
}


function configureSendGridIfAvailable() {
  const sgKey = process.env.SENDGRID_API_KEY;
  if (sgKey?.startsWith('SG.')) {
    try {
      sgMail.setApiKey(sgKey);
      return true;
    } catch (e) {
      console.warn('⚠️ No se pudo configurar SendGrid:', e.message);
    }
  }
  return false;
}

// trySendWithGmail removed — now handled by emailSender.sendMail wrapper

async function trySendWithSendGrid(correoDestino, asunto, mensaje, htmlContent, pdfAttachment) {
  const configured = configureSendGridIfAvailable();
  if (!configured) return { ok: false, reason: 'SendGrid no configurado' };

  const fromEmail = process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) return { ok: false, reason: 'FROM_EMAIL no configurado' };

  try {
    await sgMail.send({
      to: correoDestino,
      from: fromEmail,
      subject: asunto,
      html: htmlContent,
      text: mensaje,
      attachments: pdfAttachment ? [{ content: pdfAttachment.content.toString('base64'), filename: pdfAttachment.filename, type: pdfAttachment.contentType, disposition: 'attachment' }] : []
    });
    return { ok: true };
  } catch (err) {
    console.error('❌ Error SendGrid:', err.message);
    return { ok: false, reason: 'SendGrid failed', error: err };
  }
}

// Helper local para enviar correo con adjunto (evita dependencia circular con pedidoControllers)
async function enviarCorreoConAttachment(destinatario, asunto, htmlContent, pdfAttachment) {
  const attachments = pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : [];
  // Intentar Gmail vía wrapper unificado
  try {
    const result = await emailSender.sendMail(destinatario, asunto, htmlContent, attachments);
    if (result?.accepted?.length || !result?.rejected?.length) {
      console.log('✅ Correo enviado (Gmail/local transporter)');
      return;
    }
    console.warn('⚠️ Gmail/transporter no aceptó destinatario, intentando SendGrid');
  } catch (e) {
    console.warn('⚠️ Falló envío vía Gmail/transporter:', e.message);
  }
  // Fallback SendGrid
  const falloGmailMensaje = 'Fallback desde Gmail/transporter';
  const sgRes = await trySendWithSendGrid(destinatario, asunto, falloGmailMensaje, htmlContent, pdfAttachment);
  if (sgRes.ok) {
    console.log('✅ Correo enviado (SendGrid)');
    return;
  }
  throw new Error('No se pudo enviar el correo: proveedores no disponibles');
}







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

    // Intentar tratar el ID primero como Pedido
    let pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    let remisionDoc = null;
    let modo = 'pedido';

    if (!pedido) {
      // Fallback: intentar como Remision existente
      remisionDoc = await Remision.findById(pedidoId)
        .populate('cliente')
        .exec();
      if (!remisionDoc) {
        return res.status(404).json({ message: 'Pedido o remisión no encontrado' });
      }
      modo = 'remision';
    }

    let numeroRemision; let htmlContent = ''; let destinatario; let asuntoFinal; let pdfAttachment = null;

    if (modo === 'pedido') {
      destinatario = correoDestino || pedido.cliente?.correo;
      // Generar número dinámico para esta remisión derivada del pedido
      numeroRemision = `REM-${pedido.numeroPedido}-${Date.now().toString().slice(-6)}`;
      asuntoFinal = asunto || `Remisión - Pedido ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
      
      // Generar HTML colorido profesional
      const totalCalculado = pedido.productos.reduce((total, p) => total + ((p.cantidad || 0) * (p.product?.price || 0)), 0);
      htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Remisión ${numeroRemision}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 10px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
            .header h1 { font-size: 2em; margin-bottom: 10px; font-weight: 300; }
            .content { padding: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
            .info-card h3 { color: #28a745; margin-bottom: 10px; }
            .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .products-table thead { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
            .products-table th { padding: 12px; text-align: left; }
            .products-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .total-section { background: linear-gradient(135deg, #d4edda, #c3e6cb); padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .total-section strong { font-size: 1.3em; color: #28a745; }
            .message-section { background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-top: 20px; }
            .footer { background: #343a40; color: #adb5bd; padding: 20px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 REMISIÓN</h1>
              <p>N° ${numeroRemision}</p>
            </div>
            <div class="content">
              <div class="info-grid">
                <div class="info-card">
                  <h3>👤 Cliente</h3>
                  <p><strong>Nombre:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
                  <p><strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono || 'N/A'}</p>
                </div>
                <div class="info-card">
                  <h3>📋 Detalles</h3>
                  <p><strong>Pedido:</strong> ${pedido.numeroPedido}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${pedido.productos.map(p => {
                    const precio = Number(p.product?.price) || 0;
                    const cantidad = Number(p.cantidad) || 0;
                    return `<tr>
                      <td><strong>${p.product?.name || 'N/A'}</strong></td>
                      <td style="text-align: center;">${cantidad}</td>
                      <td style="text-align: right;">S/. ${precio.toFixed(2)}</td>
                      <td style="text-align: right;"><strong>S/. ${(precio * cantidad).toFixed(2)}</strong></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
              <div class="total-section">
                <strong>TOTAL: S/. ${totalCalculado.toFixed(2)}</strong>
              </div>
              ${mensaje ? `<div class="message-section"><h3>Mensaje</h3><p>${mensaje}</p></div>` : ''}
            </div>
            <div class="footer">
              <p><strong>${process.env.COMPANY_NAME || 'JLA Global Company'}</strong></p>
              <p>${process.env.GMAIL_USER || 'contacto@empresa.com'}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      try {
        console.log('📄 [REMISION] Generando PDF (derivado de pedido)...');
        console.log('📄 [REMISION] Datos pedido:', {
          numeroPedido: pedido.numeroPedido,
          productos: pedido.productos?.length,
          cliente: pedido.cliente?.nombre
        });
        const pdfService = new PDFService();
        const remisionData = {
          numeroRemision,
          pedidoReferencia: pedido._id,
          codigoPedido: pedido.numeroPedido,
          cliente: {
            nombre: pedido.cliente.nombre,
            correo: pedido.cliente.correo,
            telefono: pedido.cliente.telefono,
            ciudad: pedido.cliente.ciudad
          },
            productos: pedido.productos.map(p => ({
            nombre: p.product?.name || 'Producto',
            cantidad: p.cantidad,
            precioUnitario: p.product?.price || 0,
            total: (p.cantidad || 0) * (p.product?.price || 0),
            codigo: p.product?.codigo || 'N/A'
          })),
          fechaRemision: new Date(),
          responsable: null,
          estado: 'activa',
          total: pedido.productos.reduce((total, p) => total + ((p.cantidad || 0) * (p.product?.price || 0)), 0)
        };
        const pdfData = await pdfService.generarPDFRemision(remisionData);
        pdfAttachment = { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType };
        console.log('✅ [REMISION] PDF generado exitosamente (pedido):', pdfData.filename);
      } catch (e) {
        console.error('❌ [REMISION] Error generando PDF (pedido):', e.message);
        console.error('❌ [REMISION] Stack:', e.stack);
      }
    } else {
      // Modo remisión existente
      numeroRemision = remisionDoc.numeroRemision;
      destinatario = correoDestino || remisionDoc.cliente?.correo;
      asuntoFinal = asunto || `Remisión ${numeroRemision} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
      
      // Generar HTML colorido profesional
      const totalCalculado = remisionDoc.productos.reduce((total, p) => {
        const precio = Number(p.precioUnitario) || 0;
        const cantidad = Number(p.cantidad) || 0;
        return total + (precio * cantidad);
      }, 0);
      
      htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Remisión ${numeroRemision}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 10px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
            .header h1 { font-size: 2em; margin-bottom: 10px; font-weight: 300; }
            .content { padding: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
            .info-card h3 { color: #28a745; margin-bottom: 10px; }
            .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .products-table thead { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
            .products-table th { padding: 12px; text-align: left; }
            .products-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .total-section { background: linear-gradient(135deg, #d4edda, #c3e6cb); padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .total-section strong { font-size: 1.3em; color: #28a745; }
            .message-section { background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-top: 20px; }
            .footer { background: #343a40; color: #adb5bd; padding: 20px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 REMISIÓN</h1>
              <p>N° ${numeroRemision}</p>
            </div>
            <div class="content">
              <div class="info-grid">
                <div class="info-card">
                  <h3>👤 Cliente</h3>
                  <p><strong>Nombre:</strong> ${remisionDoc.cliente?.nombre || 'N/A'}</p>
                  <p><strong>Correo:</strong> ${remisionDoc.cliente?.correo || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> ${remisionDoc.cliente?.telefono || 'N/A'}</p>
                </div>
                <div class="info-card">
                  <h3>📋 Detalles</h3>
                  <p><strong>Número:</strong> ${numeroRemision}</p>
                  <p><strong>Fecha:</strong> ${new Date(remisionDoc.fechaRemision).toLocaleDateString('es-ES')}</p>
                  <p><strong>Estado:</strong> ${remisionDoc.estado}</p>
                </div>
              </div>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${remisionDoc.productos.map(p => {
                    const precio = Number(p.precioUnitario) || 0;
                    const cantidad = Number(p.cantidad) || 0;
                    return `<tr>
                      <td><strong>${p.nombre || 'N/A'}</strong></td>
                      <td style="text-align: center;">${cantidad}</td>
                      <td style="text-align: right;">S/. ${precio.toFixed(2)}</td>
                      <td style="text-align: right;"><strong>S/. ${(precio * cantidad).toFixed(2)}</strong></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
              <div class="total-section">
                <strong>TOTAL: S/. ${totalCalculado.toFixed(2)}</strong>
              </div>
              ${mensaje ? `<div class="message-section"><h3>Mensaje</h3><p>${mensaje}</p></div>` : ''}
            </div>
            <div class="footer">
              <p><strong>${process.env.COMPANY_NAME || 'JLA Global Company'}</strong></p>
              <p>${process.env.GMAIL_USER || 'contacto@empresa.com'}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        console.log('📄 [REMISION] Generando PDF (remisión existente)...');
        console.log('📄 [REMISION] Datos remisión:', {
          numeroRemision: remisionDoc.numeroRemision,
          productos: remisionDoc.productos?.length,
          cliente: remisionDoc.cliente?.nombre
        });
        const pdfService = new PDFService();
        const pdfData = await pdfService.generarPDFRemision(remisionDoc.toObject ? remisionDoc.toObject() : remisionDoc);
        pdfAttachment = { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType };
        console.log('✅ [REMISION] PDF generado exitosamente:', pdfData.filename);
      } catch (e) {
        console.error('❌ [REMISION] Error generando PDF:', e.message);
        console.error('❌ [REMISION] Stack:', e.stack);
      }
    }

    // Enviar primero sin bloquear por PDF (si pdfAttachment llegó antes se adjunta)
    try {
      await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);
    } catch (error_) {
      console.error('❌ Error enviando correo de remisión:', error_.message);
      return res.status(500).json({ message: 'Error al enviar remisión por correo', error: error_.message });
    }

    return res.json({ message: 'Remisión enviada por correo exitosamente', modo, numeroRemision, adjuntoPDF: !!pdfAttachment });
  } catch (error) {
    console.error('❌ Error al enviar remisión por correo:', error);
    res.status(500).json({ message: 'Error al enviar remisión por correo', error: error.message });
  }
};

// Obtener todas las remisiones
exports.getAllRemisiones = async (req, res) => {
  try {
    const { estado, limite = 50, pagina = 1 } = req.query;
    
    let filtro = {};
    
    // Sanitizar estado para prevenir inyección NoSQL con lista blanca
    if (estado && estado !== 'todas') {
      const estadoSanitizado = typeof estado === 'string' ? estado.trim() : '';
      const estadosValidos = ['Pendiente', 'Enviada', 'Entregada', 'Cancelada'];
      
      if (estadoSanitizado && estadosValidos.includes(estadoSanitizado)) {
        filtro.estado = estadoSanitizado;
      } else if (estadoSanitizado) {
        return res.status(400).json({ 
          message: 'Estado inválido. Valores permitidos: Pendiente, Enviada, Entregada, Cancelada' 
        });
      }
    }

    const remisiones = await Remision.find(filtro)
      .populate('responsable', 'username firstName surname')
      .populate('cliente', 'nombre correo ciudad telefono')
      .populate('cotizacionReferencia', 'codigo')
      .sort({ fechaRemision: -1 })
      .limit(Number.parseInt(limite, 10))
      .skip((Number.parseInt(pagina, 10) - 1) * Number.parseInt(limite, 10));

    const total = await Remision.countDocuments(filtro);

    res.json({
      remisiones,
      total,
      pagina: Number.parseInt(pagina, 10),
      totalPaginas: Math.ceil(total / Number.parseInt(limite, 10))
    });
  } catch (error) {
    console.error('Error al obtener remisiones:', error);
    res.status(500).json({ message: 'Error al obtener remisiones', error: error.message });
  }
};





// Eliminar remisión (solo si está en estado 'cancelada')
exports.deleteRemision = async (req, res) => {
  try {
    const remision = await Remision.findById(req.params.id);
    
    if (!remision) {
      return res.status(404).json({ message: 'Remisión no encontrada' });
    }

    if (remision.estado !== 'cancelada') {
      return res.status(400).json({ 
        message: 'Solo se pueden eliminar remisiones canceladas' 
      });
    }

    await Remision.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Remisión eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar remisión:', error);
    res.status(500).json({ message: 'Error al eliminar remisión', error: error.message });
  }
};

// Obtener estadísticas sencillas de remisiones (conteos por estado)
exports.getEstadisticasRemisiones = async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ];
    const resultados = await Remision.aggregate(pipeline);
    const stats = resultados.reduce((acc, item) => {
      acc[item._id || 'sin_estado'] = item.count;
      return acc;
    }, {});
    return res.json({ stats });
  } catch (error) {
    console.error('Error al obtener estadísticas de remisiones:', error);
    return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};

// Obtener una remisión por ID
exports.getRemisionById = async (req, res) => {
  try {
    const remision = await fetchRemisionOrThrow(req.params.id);
    return res.json({ remision });
  } catch (error) {
    if (error.code === 'INVALID_ID') return res.status(400).json({ message: 'ID de remisión inválido' });
    if (error.code === 'REMISION_NOT_FOUND') return res.status(404).json({ message: 'Remisión no encontrada' });
    console.error('Error al obtener remisión por id:', error);
    return res.status(500).json({ message: 'Error al obtener remisión', error: error.message });
  }
};



// Obtener remisión por referencia de cotización
exports.getByCotizacionReferencia = async (req, res) => {
  try {
    const cotizacionId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!/^[0-9a-fA-F]{24}$/.exec(cotizacionId)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    const remision = await Remision.findOne({ cotizacionReferencia: cotizacionId }).select('_id numeroRemision cotizacionReferencia');
    if (!remision) {
      return res.json({ existe: false });
    }

    return res.json({ existe: true, numeroRemision: remision.numeroRemision, remisionId: remision._id });
  } catch (error) {
    console.error('Error al buscar remisión por cotización:', error);
    return res.status(500).json({ message: 'Error al buscar remisión por cotización', error: error.message });
  }
};

// Helper: Buscar o crear cliente
async function findOrCreateCliente(clienteBody, useSession, session, ClienteModel) {
  const correo = (clienteBody.correo || '').toLowerCase().trim();
  let clienteDoc = null;
  if (correo) {
    clienteDoc = useSession
      ? await ClienteModel.findOne({ correo }).session(session).exec()
      : await ClienteModel.findOne({ correo }).exec();
  }

  if (!clienteDoc) {
    const nuevo = new ClienteModel({
      nombre: clienteBody.nombre || 'Cliente sin nombre',
      ciudad: clienteBody.ciudad || '',
      direccion: clienteBody.direccion || '',
      telefono: clienteBody.telefono || '',
      correo: correo || '',
      esCliente: true,
      operacion: 'compra'
    });
    clienteDoc = useSession ? await nuevo.save({ session }) : await nuevo.save();
  }
  return clienteDoc;
}

// Helper: Generar número de remisión
async function generateNumeroRemision(useSession, session, CounterModel) {
  const counter = await CounterModel.findByIdAndUpdate(
    { _id: 'remision' },
    { $inc: { seq: 1 } },
    useSession ? { new: true, upsert: true, session } : { new: true, upsert: true }
  ).exec();
  const seq = counter ? counter.seq : Date.now();
  return `REM-${String(seq).padStart(6, '0')}`;
}

// Helper: Procesar un producto individual
async function processProduct(p, useSession, session, Product, adjustments) {
  const cantidad = Number.parseFloat(p.cantidad || 0) || 0;
  const precioUnitario = Number.parseFloat(p.valorUnitario || p.precioUnitario || 0) || 0;
  const total = Number.parseFloat((cantidad * precioUnitario).toFixed(2)) || 0;
  const prodId = sanitizarId(p.producto || p.productId || p.id);

  if (prodId) {
    const prodDoc = useSession
      ? await Product.findById(prodId).session(session).exec()
      : await Product.findById(prodId).exec();
    
    if (!prodDoc) {
      const err = new Error('Producto no encontrado');
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    
    if (typeof prodDoc.stock !== 'number' || prodDoc.stock < cantidad) {
      const err = new Error(`Stock insuficiente para ${prodDoc.name}. Disponible: ${prodDoc.stock}, solicitado: ${cantidad}`);
      err.code = 'STOCK_INSUFICIENTE';
      throw err;
    }
    
    // Descontar stock de forma atómica
    const updateOpts = useSession ? { session, new: true } : { new: true };
    const updated = await Product.findOneAndUpdate(
      { _id: prodId, stock: { $gte: cantidad } },
      { $inc: { stock: -cantidad } },
      updateOpts
    ).exec();
    
    if (!updated) {
      const err = new Error(`Stock insuficiente para ${prodDoc.name}. Disponible: ${prodDoc.stock}, solicitado: ${cantidad}`);
      err.code = 'STOCK_INSUFICIENTE';
      throw err;
    }
    
    if (!useSession) adjustments.push({ _id: prodId, qty: cantidad });

    return {
      nombre: p.nombre || prodDoc.name || p.productoNombre || p.descripcion || 'Producto',
      cantidad,
      precioUnitario,
      total,
      descripcion: p.descripcion || prodDoc.description || '',
      codigo: p.codigo || ''
    };
  }
  
  // Producto sin ID (manual), no gestiona stock
  return {
    nombre: p.nombre || p.productoNombre || p.descripcion || 'Producto',
    cantidad,
    precioUnitario,
    total,
    descripcion: p.descripcion || '',
    codigo: p.codigo || ''
  };
}

// Helper: Verificar si el error es por falta de soporte de transacciones
function isTransactionNotSupportedError(error) {
  const msg = String(error?.message || '');
  return msg.includes('Transaction numbers are only allowed') || 
         msg.includes('replica set') || 
         msg.includes('Transaction') || 
         error?.codeName === 'NoSuchTransaction';
}

// Helper: Compensar stock en caso de error
async function compensateStockAdjustments(adjustments, Product) {
  try {
    for (const adj of adjustments) {
      await Product.updateOne({ _id: adj._id }, { $inc: { stock: adj.qty } }).exec();
    }
  } catch (rollbackError_) {
    console.warn('⚠️ Falló compensación de stock:', rollbackError_?.message || rollbackError_);
  }
}

// Crear una nueva remisión (simplificada, segura y reutilizable)
exports.createRemision = async (req, res) => {
  const mongoose = require('mongoose');
  const Product = require('../models/Products');
  const ClienteModel = require('../models/Cliente');
  const RemisionModel = require('../models/Remision');
  const CounterModel = require('../models/Counter');
  const session = await mongoose.startSession();
  try {
    const { cliente: clienteBody, productos = [], fechaEntrega, descripcion = '', condicionesPago = '' } = req.body;

    if (!clienteBody?.correo || !clienteBody?.nombre) {
      return res.status(400).json({ message: 'Datos de cliente incompletos' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: 'La remisión debe contener al menos un producto' });
    }

    let savedRemision;
    const runCoreFlow = async (useSession) => {
      // Buscar/crear cliente por correo
      const clienteDoc = await findOrCreateCliente(clienteBody, useSession, session, ClienteModel);

      // Generar número de remisión con contador atómico
      const numeroRemision = await generateNumeroRemision(useSession, session, CounterModel);

      // Validar y descontar stock por cada producto con ID
      const productosNormalized = [];
      const adjustments = []; // para compensación en fallback sin transacción
      
      for (const p of productos) {
        const normalizedProduct = await processProduct(p, useSession, session, Product, adjustments);
        productosNormalized.push(normalizedProduct);
      }

      const subtotal = productosNormalized.reduce((acc, x) => acc + (x.total || 0), 0);
      const total = subtotal;
      const cantidadItems = productosNormalized.length;
      const cantidadTotal = productosNormalized.reduce((acc, x) => acc + (x.cantidad || 0), 0);

      const remisionDoc = new RemisionModel({
        numeroRemision,
        descripcion,
        cliente: clienteDoc._id,
        productos: productosNormalized,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : new Date(),
        observaciones: '',
        condicionesPago,
          responsable: req.userId || req.user?.id || req.user?._id || undefined,
        subtotal,
        total,
        cantidadItems,
        cantidadTotal
      });

      savedRemision = useSession ? await remisionDoc.save({ session }) : await remisionDoc.save();
      return { adjustments };
    };

    try {
      await session.withTransaction(async () => { await runCoreFlow(true); });
    } catch (txError) {
      if (!isTransactionNotSupportedError(txError)) throw txError;
      
      // Fallback sin transacción: aplicar compensación si falla en medio
      let result;
      try {
        result = await runCoreFlow(false);
      } catch (error_) {
        // best-effort rollback
        await compensateStockAdjustments(result?.adjustments || [], Product);
        throw error_;
      }
    }

    return res.status(201).json({ message: 'Remisión creada', remision: savedRemision });
  } catch (error) {
    if (error.code === 'STOCK_INSUFICIENTE') {
      return res.status(400).json({ message: error.message, codigo: 'STOCK_INSUFICIENTE' });
    }
    if (error.code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error creando remisión:', error);
    return res.status(500).json({ message: 'Error creando remisión', error: error.message });
  } finally {
    session.endSession();
  }
};
