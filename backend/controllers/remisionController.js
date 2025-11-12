const Remision = require('../models/Remision');
const Pedido = require('../models/Pedido');
const Counter = require('../models/Counter');
const nodemailer = require('nodemailer');
const PDFService = require('../services/pdfService');
const sgMail = require('@sendgrid/mail');

// --- Helpers (moved to top-level) ---
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}

async function fetchRemisionOrThrow(id) {
  const remision = await Remision.findById(id)
    .populate('responsable', 'username firstName surname')
    .populate('cotizacionReferencia', 'codigo');
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
  if (sgKey && sgKey.startsWith('SG.')) {
    try {
      sgMail.setApiKey(sgKey);
      return true;
    } catch (e) {
      console.warn('⚠️ No se pudo configurar SendGrid:', e.message);
    }
  }
  return false;
}

async function trySendWithGmail(correoDestino, asunto, mensaje, htmlContent, pdfAttachment) {
  if (!(process.env.EMAIL_USER || process.env.GMAIL_USER) || !(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) {
    return { ok: false, reason: 'Gmail no configurado' };
  }

  try {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
    await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Sistema de Remisiones'}" <${emailUser}>`,
      to: correoDestino,
      subject: asunto,
      html: htmlContent,
      text: mensaje,
      attachments: pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : []
    });
    return { ok: true };
  } catch (err) {
    console.error('❌ Error Gmail SMTP:', err.message);
    return { ok: false, reason: 'Gmail failed', error: err };
  }
}

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

function respondSimulatedOrError(res, lastError, correoDestino, asunto) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment) {
    console.log('🧪 Modo desarrollo: simulando envío de correo');
    return res.json({ message: 'Remisión enviada por correo exitosamente (modo desarrollo)', destinatario: correoDestino, asunto, simulado: true, proveedor: 'Simulado - Desarrollo', nota: 'En producción, configure correctamente Gmail SMTP o SendGrid' });
  }

  console.error('❌ No se pudo enviar el correo con ningún proveedor');
  return res.status(500).json({ message: 'Error al enviar correo', error: lastError?.message || 'Error desconocido en los proveedores de correo', detalles: 'Verifique la configuración de Gmail SMTP o SendGrid', configuracion: { gmail: !!(process.env.GMAIL_USER || process.env.EMAIL_USER), sendgrid: !!process.env.SENDGRID_API_KEY } });
}

// Enviar remisión por correo (refactorado, baja complejidad)
exports.enviarRemisionPorCorreo = async (req, res) => {
  try {
    const correoDestino = req.body.correoDestino;
    const asunto = req.body.asunto;
    const mensaje = req.body.mensaje || '';

    if (!correoDestino || !isValidEmail(correoDestino)) {
      return res.status(400).json({ message: 'Correo destinatario inválido o faltante' });
    }

    let remision;
    try {
      remision = await fetchRemisionOrThrow(req.params.id);
    } catch (e) {
      if (e.code === 'REMISION_NOT_FOUND') return res.status(404).json({ message: 'Remisión no encontrada', id: req.params.id });
      throw e;
    }

    // Preparar asunto y contenido HTML sencillo (no el template completo para reducir complejidad)
    const asuntoFinal = asunto || `Remisión ${remision.numeroRemision} - ${process.env.COMPANY_NAME || ''}`;
    const htmlContent = `<!doctype html><html><body><h2>Remisión ${remision.numeroRemision}</h2><p>Cliente: ${remision.cliente?.nombre || 'N/A'}</p><p>Total: $${(remision.total || 0).toLocaleString('es-ES')}</p><div>${mensaje}</div></body></html>`;

    const pdfAttachment = await generatePdfAttachmentSafe(remision);

    // Intentar Gmail
    let result = await trySendWithGmail(correoDestino, asuntoFinal, mensaje, htmlContent, pdfAttachment);
    if (result.ok) return res.json({ message: 'Remisión enviada por correo exitosamente', proveedor: 'Gmail' });

    // Intentar SendGrid
    result = await trySendWithSendGrid(correoDestino, asuntoFinal, mensaje, htmlContent, pdfAttachment);
    if (result.ok) return res.json({ message: 'Remisión enviada por correo exitosamente', proveedor: 'SendGrid' });

    // Nada funcionó
    return respondSimulatedOrError(res, result.error || null, correoDestino, asuntoFinal);
  } catch (error) {
    console.error('❌ Error al enviar remisión por correo:', error);
    return res.status(500).json({ message: 'Error al enviar remisión por correo', error: error.message });
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

// 🆕 Crear remisión desde un pedido
exports.crearRemisionDesdePedido = async (req, res) => {
  try {
    const pedidoId = req.params.pedidoId;

    // Sanitizar el ID para prevenir inyección NoSQL
    const pedidoIdSanitizado = typeof pedidoId === 'string' ? pedidoId.trim() : '';
    if (!pedidoIdSanitizado || !pedidoIdSanitizado.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de pedido inválido' });
    }

    console.log(`📋 Creando remisión desde pedido ID: ${pedidoIdSanitizado}`);

    const pedido = await Pedido.findById(pedidoIdSanitizado)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado', error: 'PEDIDO_NOT_FOUND' });
    }

    if (!['entregado', 'despachado'].includes(pedido.estado)) {
      return res.status(400).json({ message: 'Solo se pueden crear remisiones de pedidos entregados o despachados', estadoActual: pedido.estado });
    }

    const remisionExistente = await Remision.findOne({ pedidoReferencia: pedidoIdSanitizado });
    if (remisionExistente) {
      return res.status(200).json({ message: 'Ya existe una remisión para este pedido', remision: remisionExistente, existente: true });
    }

    const counter = await Counter.findByIdAndUpdate('remision', { $inc: { seq: 1 } }, { new: true, upsert: true });
    const numeroRemision = `REM-${String(counter.seq).padStart(5, '0')}`;

    const productos = pedido.productos.map(p => ({
      nombre: p.product?.name || p.product?.nombre || p.nombreProducto || `Producto ${p.product?._id || 'ID'}`,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      total: p.cantidad * p.precioUnitario,
      descripcion: p.product?.description || p.product?.descripcion || '',
      codigo: p.product?.code || p.product?.codigo || ''
    }));

    const total = productos.reduce((sum, p) => sum + p.total, 0);
    const cantidadTotal = productos.reduce((sum, p) => sum + p.cantidad, 0);

    const nuevaRemision = new Remision({
      numeroRemision,
      pedidoReferencia: pedido._id,
      codigoPedido: pedido.numeroPedido,
      cliente: {
        nombre: pedido.cliente?.nombre,
        correo: pedido.cliente?.correo,
        telefono: pedido.cliente?.telefono,
        ciudad: pedido.cliente?.ciudad,
        direccion: pedido.cliente?.direccion
      },
      productos,
      fechaRemision: new Date(),
      fechaEntrega: pedido.fechaEntrega || new Date(),
      observaciones: `Remisión generada automáticamente desde pedido ${pedido.numeroPedido}`,
      responsable: req.userId,
      estado: 'activa',
      total,
      cantidadItems: productos.length,
      cantidadTotal
    });

    const remisionGuardada = await nuevaRemision.save();
    await remisionGuardada.populate('responsable', 'username firstName surname');

    console.log(`✅ Remisión creada: ${numeroRemision} para pedido ${pedido.numeroPedido}`);

    return res.status(201).json({ message: 'Remisión creada exitosamente', remision: remisionGuardada, creada: true });
  } catch (error) {
    console.error('❌ Error al crear remisión desde pedido:', error);
    return res.status(500).json({ message: 'Error al crear remisión', error: error.message });
  }
};

// Probar configuración de Gmail SMTP
exports.probarGmail = async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      return res.status(400).json({ 
        message: 'Gmail SMTP no configurado',
        faltantes: {
          usuario: !emailUser ? 'EMAIL_USER o GMAIL_USER' : null,
          contraseña: !emailPass ? 'EMAIL_PASS o GMAIL_APP_PASSWORD' : null
        }
      });
    }

    console.log('🧪 Probando Gmail SMTP con configuración:', {
      usuario: emailUser,
      contraseña: emailPass.substring(0, 4) + '...'
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Verificar la conexión
    await transporter.verify();
    
    console.log('✅ Gmail SMTP verificado correctamente');
    
    res.json({
      message: 'Gmail SMTP configurado y verificado correctamente',
      configuracion: {
        usuario: emailUser,
        servicio: 'gmail'
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
    if (!sgKey || !sgKey.startsWith('SG.')) {
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