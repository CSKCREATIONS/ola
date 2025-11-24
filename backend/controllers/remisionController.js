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

async function generatePdfAttachmentSafe(remision) {
  try {
    const pdfService = new PDFService();
    const pdfData = await pdfService.generarPDFRemision(remision);
    return pdfData ? { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType } : null;
  } catch (e) {
    console.error('⚠️ Error generando PDF (no crítico):', e.message);
    return null;
  }
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
      // Use PDFService to produce consistent HTML (same design as PDFs)
      try {
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

        // Generate HTML and PDF (PDF generation already attempted below; reuse html here)
        htmlContent = pdfService.generarHTMLRemision(remisionData);

        // Try to inline CSS for better email rendering
        try {
          const juice = require('juice');
          htmlContent = juice(htmlContent);
        } catch (inlineErr) {
          // juice not available or failed - continue with non-inlined HTML
          console.warn('⚠️ Juice inlining skipped (pedido remisión):', inlineErr?.message || inlineErr);
        }
      } catch (e) {
        console.warn('⚠️ Fallback: no se pudo generar HTML profesional para remisión (pedido):', e.message);
        // Fallback to simple HTML
        htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Remisión ${numeroRemision}</title></head><body style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2 style="margin:0 0 12px;">Remisión ${numeroRemision}</h2>
        <p><strong>Pedido origen:</strong> ${pedido.numeroPedido}</p>
        <p><strong>Cliente:</strong> ${pedido.cliente?.nombre || 'N/A'} | <strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
        <p><strong>Productos:</strong> ${(pedido.productos||[]).length} items</p>
        ${mensaje ? `<div style='margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9;'>${mensaje}</div>` : ''}
        <p style="margin-top:20px;font-size:12px;color:#666;">Documento generado automáticamente - ${new Date().toLocaleString('es-ES')}</p>
      </body></html>`;
      }
      try {
        console.log('📄 Generando PDF (derivado de pedido)...');
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
        console.log('✅ PDF generado (pedido)');
      } catch (e) {
        console.warn('⚠️ PDF no generado (pedido):', e.message);
      }
    } else {
      // Modo remisión existente
      numeroRemision = remisionDoc.numeroRemision;
      destinatario = correoDestino || remisionDoc.cliente?.correo;
      asuntoFinal = asunto || `Remisión ${numeroRemision} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
      // Use PDFService to build consistent HTML for existing remisión
      try {
        const pdfService = new PDFService();
        const remObj = remisionDoc.toObject ? remisionDoc.toObject() : remisionDoc;
        htmlContent = pdfService.generarHTMLRemision(remObj);

        try {
          const juice = require('juice');
          htmlContent = juice(htmlContent);
        } catch (inlineErr) {
          console.warn('⚠️ Juice inlining skipped (remisión existente):', inlineErr?.message || inlineErr);
        }
      } catch (e) {
        console.warn('⚠️ Fallback: no se pudo generar HTML profesional para remisión existente:', e.message);
        htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Remisión ${numeroRemision}</title></head><body style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2 style="margin:0 0 12px;">Remisión ${numeroRemision}</h2>
        <p><strong>Cliente:</strong> ${remisionDoc.cliente?.nombre || 'N/A'} | <strong>Correo:</strong> ${remisionDoc.cliente?.correo || 'N/A'}</p>
        <p><strong>Productos:</strong> ${(remisionDoc.productos||[]).length} items</p>
        ${mensaje ? `<div style='margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9;'>${mensaje}</div>` : ''}
        <p style="margin-top:20px;font-size:12px;color:#666;">Documento generado automáticamente - ${new Date().toLocaleString('es-ES')}</p>
      </body></html>`;
      }
      const pedidoLike = {
        numeroPedido: remisionDoc.codigoPedido || remisionDoc.numeroRemision,
        cliente: remisionDoc.cliente,
        estado: remisionDoc.estado,
        observaciones: remisionDoc.observaciones,
        productos: (remisionDoc.productos || []).map(p => ({
          product: { name: p.nombre, price: p.precioUnitario, codigo: p.codigo },
          cantidad: p.cantidad
        }))
      };

      try {
        console.log('📄 Generando PDF (remisión existente)...');
        const pdfService = new PDFService();
        const pdfData = await pdfService.generarPDFRemision(remisionDoc.toObject ? remisionDoc.toObject() : remisionDoc);
        pdfAttachment = { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType };
        console.log('✅ PDF generado (remisión)');
      } catch (e) {
        console.warn('⚠️ PDF no generado (remisión):', e.message);
      }
    }

    // Enviar primero sin bloquear por PDF (si pdfAttachment llegó antes se adjunta)
    try {
      await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);
    } catch (sendErr) {
      console.error('❌ Error enviando correo de remisión:', sendErr.message);
      return res.status(500).json({ message: 'Error al enviar remisión por correo', error: sendErr.message });
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


// Probar configuración de Gmail SMTP (usa wrapper centralizado)
exports.probarGmail = async (req, res) => {
  try {
    const { getGmailTransporter } = require('../utils/gmailSender');
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      return res.status(400).json({ 
        message: 'Gmail SMTP no configurado',
        faltantes: {
          usuario: emailUser ? null : 'EMAIL_USER o GMAIL_USER',
          contraseña: emailPass ? null : 'EMAIL_PASS o GMAIL_APP_PASSWORD'
        }
      });
    }

    console.log('🧪 Probando Gmail SMTP - usuario configurado:', !!emailUser);

    // Use centralized transporter factory (ensures consistent TLS config)
    const transporter = getGmailTransporter();
    if (!transporter) {
      return res.status(500).json({ message: 'No se pudo crear transporter de Gmail (revise credenciales en .env)' });
    }

    // Verificar la conexión (throws on failure)
    await transporter.verify();

    console.log('✅ Gmail SMTPS verificado correctamente');

    // Warn if APP_URL is configured with http (insecure)
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL;
    if (appUrl && typeof appUrl === 'string' && appUrl.startsWith('http://')) {
      console.warn('⚠️ APP_URL está usando http:// — se recomienda usar https:// en producción');
    }

    res.json({
      message: 'Gmail SMTP configurado y verificado correctamente',
      configuracion: {
        usuario: emailUser,
        servicio: 'gmail_smtps',
        secure: true
      }
    });

  } catch (error) {
    console.error('❌ Error en prueba Gmail SMTP:', error);
    res.status(500).json({
      message: 'Error en configuración de Gmail SMTP',
      error: error.message,
      code: error.code,
      solucion: error.code === 'EAUTH' ? 
        'Verifique que la contraseña de aplicación de Gmail sea correcta' :
        'Verifique la conexión a internet y configuración de Gmail'
    });
  }
};

// Probar configuración de SendGrid
exports.probarSendGrid = async (req, res) => {
  try {
    const sgKey = process.env.SENDGRID_API_KEY;
    if (!sgKey?.startsWith('SG.')) {
      return res.status(400).json({ message: 'SENDGRID_API_KEY no configurada o inválida' });
    }

    sgMail.setApiKey(sgKey);
    
    const testEmail = {
      to: 'test@example.com', // Email de prueba
      from: process.env.SENDGRID_FROM_EMAIL || 'test@test.com',
      subject: 'Prueba de configuración SendGrid',
      text: 'Este es un correo de prueba'
    };

    console.log('🧪 Probando SendGrid con configuración:', {
      apiKey: 'SG.***',
      fromEmail: testEmail.from,
      toEmail: testEmail.to
    });

    // Intentar validar la configuración sin enviar realmente
    await sgMail.send(testEmail);
    
    res.json({
      message: 'SendGrid configurado correctamente',
      configuracion: {
        apiKey: 'Configurada (' + process.env.SENDGRID_API_KEY.substring(0, 10) + '...)',
        fromEmail: testEmail.from
      }
    });

  } catch (error) {
    console.error('❌ Error en prueba SendGrid:', error);
    res.status(500).json({
      message: 'Error en configuración de SendGrid',
      error: error.message,
      detalles: error.response?.body || 'Error desconocido',
      solucion: 'Verifique que la API key sea válida y que el correo FROM esté verificado en SendGrid'
    });
  }
};

// Verificar configuración de correo (para debugging)
exports.verificarConfiguracionCorreo = async (req, res) => {
  try {
    const config = {
      gmail: {
        configurado: !!(process.env.GMAIL_USER || process.env.EMAIL_USER) && !!(process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS),
        usuario: process.env.GMAIL_USER || process.env.EMAIL_USER || 'No configurado'
      },
      sendgrid: {
        configurado: !!process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'No configurado'
      }
    };

    res.json({
      message: 'Configuración de correo',
      proveedores: config,
      recomendacion: !config.gmail.configurado && !config.sendgrid.configurado ? 
        'Configure al menos Gmail SMTP o SendGrid para enviar correos' : 
        'Al menos un proveedor está configurado'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar configuración', error: error.message });
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

// Actualizar estado de una remisión (ej: marcar como entregada/cancelada)
exports.updateEstadoRemision = async (req, res) => {
  try {
    const nuevoEstado = req.body.estado;
    if (!nuevoEstado || typeof nuevoEstado !== 'string') {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    const remision = await Remision.findById(req.params.id);
    if (!remision) return res.status(404).json({ message: 'Remisión no encontrada' });
    remision.estado = nuevoEstado;
    await remision.save();
    return res.json({ message: 'Estado actualizado', remision });
  } catch (error) {
    console.error('Error al actualizar estado de remisión:', error);
    return res.status(500).json({ message: 'Error actualizando estado', error: error.message });
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