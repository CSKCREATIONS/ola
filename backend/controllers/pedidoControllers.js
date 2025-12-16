// controllers/pedidoController.js
const Pedido = require('../models/Pedido');
const Product = require('../models/Products');
const Cotizacion = require('../models/cotizaciones');
const Counter = require('../models/Counter');
const Cliente = require('../models/Cliente');
const Remision = require('../models/Remision');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const PDFService = require('../services/pdfService');
const { enviarConGmail } = require('../utils/gmailSender');

// Helper function para sanitizar IDs y prevenir inyección NoSQL
const sanitizarId = (id) => {
  const idSanitizado = typeof id === 'string' ? id.trim() : '';
  if (!/^[0-9a-fA-F]{24}$/.exec(idSanitizado)) {
    return null;
  }
  return idSanitizado;
};

// Helper: resolver o crear cliente a partir del payload recibido
async function resolveClienteId(cliente) {
  if (!cliente) throw new Error('Falta información del cliente');

  if (typeof cliente === 'string' && mongoose.Types.ObjectId.isValid(cliente)) {
    return cliente;
  }

  if (cliente && typeof cliente === 'object') {
    if (cliente._id && mongoose.Types.ObjectId.isValid(cliente._id)) {
      return cliente._id;
    }

    if (cliente.correo) {
      const correo = (cliente.correo || '').toLowerCase();
      let clienteExistente = await Cliente.findOne({ correo });
      if (!clienteExistente) {
        const nuevoCliente = new Cliente({
          nombre: cliente.nombre || cliente.nombreCliente || '',
          correo,
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          ciudad: cliente.ciudad || '',
          esCliente: false,
          operacion: cliente.operacion || undefined
        });
        clienteExistente = await nuevoCliente.save();
      }
      return clienteExistente._id;
    }

    const nuevoCliente = new Cliente({
      nombre: cliente.nombre || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      esCliente: false,
      operacion: cliente.operacion || undefined
    });
    const creado = await nuevoCliente.save();
    return creado._id;
  }

  throw new Error('Cliente inválido');
}

// Helper: mapear productos desde el payload al esquema esperado
function mapearProductos(productos) {
  return (productos || []).map(item => {
    const prodId = (item.producto && (item.producto.id || item.producto)) || item.product || null;
    return {
      product: prodId,
      cantidad: (item.cantidad !== undefined && item.cantidad !== null) ? item.cantidad : 0,
      precioUnitario: item.precioUnitario || item.valorUnitario || 0
    };
  });
}

// Helper: intentar guardar pedido con reintento en caso de duplicado de numero
async function savePedidoWithRetry(nuevoPedido) {
  try {
    return await nuevoPedido.save();
  } catch (error_) {
    if (error_?.code === 11000) {
      const counter2 = await Counter.findOneAndUpdate(
        { _id: 'pedido' },
        { $inc: { seq: 1 } },
        { new: true }
      );
      const numeroPedido2 = `PED-${String(counter2.seq).padStart(5, '0')}`;
      nuevoPedido.numeroPedido = numeroPedido2;
      return await nuevoPedido.save();
    }
    throw error_;
  }
}

// Helper: marcar cotización como agendada (no fallamos si falla)
async function safeMarkCotizacionAgendada(cotizacionReferenciada, pedidoId, cotizacionCodigo) {
  try {
    if (!cotizacionReferenciada) return;
    await Cotizacion.findByIdAndUpdate(
      cotizacionReferenciada,
      { estado: 'Agendada', pedidoReferencia: pedidoId }
    );
    console.log(`✅ Cotización ${cotizacionCodigo} marcada como agendada (estado updated)`);
  } catch (cotError) {
    console.error('⚠️ Error al marcar cotización como agendada (estado):', cotError);
  }
}

// Helper: actualizar campo esCliente del cliente (no bloquear flujo)
async function safeSetClienteEsCliente(clienteId) {
  try {
    if (!clienteId) return;
    await Cliente.findByIdAndUpdate(clienteId, { esCliente: true }, { new: true });
    console.log(`✅ Cliente ${clienteId} marcado como cliente activo (esCliente: true)`);
  } catch (clienteError) {
    console.error('⚠️ Error al actualizar estado del cliente:', clienteError);
  }
}

// Helper: aplicar reglas de actualización de cliente después de crear un pedido
async function applyPostPedidoClienteRules(clienteId, cotizacionReferenciada, clientePayload) {
  if (!clienteId) return;

  if (cotizacionReferenciada) {
    try {
      const clienteDoc = await Cliente.findById(clienteId).exec();
      if (!clienteDoc) return;

      const esClienteFlag = clienteDoc.esCliente === true || String(clienteDoc.esCliente).toLowerCase() === 'true';
      if (esClienteFlag) {
        console.log(`Cliente ${clienteId} ya es cliente (esCliente:true): no se modificó nada`);
      } else {
        await Cliente.findByIdAndUpdate(clienteId, { operacion: 'agenda' }, { new: true }).exec();
        console.log(`Cliente ${clienteId} es prospecto: establecido operacion='agenda' (no se cambia esCliente)`);
      }
    } catch (err) {
      console.warn('⚠️ No se pudo actualizar operacion del cliente tras agendar desde cotización:', err?.message || err);
    }
    return;
  }

  try {
    if (clientePayload && typeof clientePayload === 'object' && clientePayload.operacion === 'agenda') {
      console.log('Cliente creado desde agenda: se omite marcar esCliente:true');
    } else {
      await safeSetClienteEsCliente(clienteId);
    }
  } catch (err) {
    console.warn('⚠️ Error aplicando reglas legacy de cliente post-pedido:', err?.message || err);
  }
}

// Helper: construir productos para documento de remisión
function buildProductosRemisionDoc(pedido) {
  return (pedido.productos || []).map(prod => ({
    nombre: prod.product?.name || prod.nombre || 'Producto sin nombre',
    cantidad: prod.cantidad || 0,
    precioUnitario: prod.precioUnitario || prod.valorUnitario || 0,
    total: (prod.cantidad || 0) * (prod.precioUnitario || prod.valorUnitario || 0),
    descripcion: prod.descripcion || prod.product?.description || '',
    codigo: prod.product?.codigo || prod.codigo || ''
  }));
}

// Helper: construir observaciones finales para remisión
function buildObsFinal(pedido, observaciones) {
  let obs = observaciones || `Remisión generada desde pedido ${pedido.numeroPedido}`;
  if (pedido.cotizacionReferenciada) {
    const codigoCot = (typeof pedido.cotizacionReferenciada === 'object')
      ? (pedido.cotizacionReferenciada.codigo || String(pedido.cotizacionReferenciada._id || ''))
      : String(pedido.cotizacionReferenciada);
    obs = `${obs} y Cotización: ${codigoCot}`;
  }
  return obs;
}

// Helper: marcar cotización como remisionada (no bloqueante)
async function safeMarkCotizacionRemisionada(cotizacionId) {
  try {
    if (!cotizacionId) return;
    await Cotizacion.findByIdAndUpdate(cotizacionId, { estado: 'remisionada' });
  } catch (err) {
    console.warn('⚠️ No se pudo marcar la cotización como remisionada:', err?.message || err);
  }
}

// Helper: actualizar pedido con referencia a remisión (no bloqueante)
async function safeUpdatePedidoWithRemision(pedido, nuevaRemisionId, numeroRemision) {
  try {
    pedido.estado = 'entregado';
    pedido.remisionReferencia = nuevaRemisionId;
    pedido.codigoRemision = numeroRemision;
    await pedido.save();
  } catch (err) {
    console.warn('No se pudo actualizar pedido con referencia a remisión:', err.message || err);
  }
}

// Helper: actualizar stock de productos cuando el pedido se entrega
async function updateStockIfEntregado(pedido) {
  const Products = require('../models/Products');

  if (pedido.estado && String(pedido.estado).toLowerCase() === 'entregado') {
    console.log(`🔁 Pedido ${pedido._id} ya marcado como entregado, se omite actualización de stock para evitar doble descuento.`);
    return { ok: true, skipped: true };
  }

  for (const item of pedido.productos) {
    if (!item.product) continue;

    const producto = await Products.findById(item.product._id || item.product);
    if (!producto) continue;

    if (producto.stock < item.cantidad) {
      return {
        ok: false,
        status: 400,
        message: `Stock insuficiente para ${producto.name}. Stock actual: ${producto.stock}, requerido: ${item.cantidad}`
      };
    }

    producto.stock -= item.cantidad;
    await producto.save();
    console.log(`📦 Stock actualizado: ${producto.name} - Stock anterior: ${producto.stock + item.cantidad}, Stock nuevo: ${producto.stock}`);
  }

  return { ok: true };
}

// Helper: parsear fecha de entrega de forma segura
function parseFechaEntregaSafe(fechaEntrega) {
  if (!fechaEntrega) return null;
  const tmp = new Date(fechaEntrega);
  if (tmp instanceof Date && !Number.isNaN(tmp.getTime())) {
    return tmp;
  }
  return null;
}

// Helper: actualizar fecha de entrega en el pedido
async function updatePedidoFechaEntrega(pedido, fechaEntregaParsed) {
  try {
    if (fechaEntregaParsed) {
      pedido.fechaEntrega = fechaEntregaParsed;
    } else if (!pedido.fechaEntrega) {
      pedido.fechaEntrega = new Date();
    }
  } catch (error_) {
    console.warn('⚠️ No se pudo asignar fechaEntrega al pedido (no crítico):', error_?.message || error_);
  }
}

// Helper: promover prospecto a cliente tras remisionar
async function promoteClienteIfProspecto(clienteRef) {
  try {
    if (!clienteRef) return;
    const clienteDoc = await Cliente.findById(clienteRef).exec();
    if (!clienteDoc) return;
    
    const esClienteFlag = clienteDoc.esCliente === true || String(clienteDoc.esCliente).toLowerCase() === 'true';
    if (esClienteFlag) {
      console.log(`Cliente ${clienteRef} ya es cliente activo (esCliente:true) - no se realizaron cambios`);
    } else {
      await Cliente.findByIdAndUpdate(clienteRef, { esCliente: true, operacion: 'compra' }, { new: true }).exec();
      console.log(`Cliente ${clienteRef} actualizado: esCliente=true, operacion='compra'`);
    }
  } catch (error_) {
    console.warn('⚠️ No se pudo actualizar el cliente tras remisionar (no bloqueante):', error_?.message || error_);
  }
}

// Configurar SendGrid de forma segura
try {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey?.startsWith('SG.')) {
    sgMail.setApiKey(apiKey);
    console.log('✉️  SendGrid listo (pedidos)');
  } else {
    console.log('✉️  SendGrid no configurado (pedidos): se omitirá hasta el envío');
  }
} catch (e) {
  console.warn('⚠️  No se pudo inicializar SendGrid (pedidos). Continuando sin correo:', e.message);
}

exports.getPedidos = async (req, res) => {
  try {
    const { estado } = req.query;

    let filtro = {};
    if (estado) {
      const estadoSanitizado = typeof estado === 'string' ? estado.trim() : '';
      const estadosValidos = ['Pendiente', 'Agendado', 'Entregado', 'Cancelado'];

      if (estadoSanitizado && estadosValidos.includes(estadoSanitizado)) {
        filtro = { estado: estadoSanitizado };
      } else if (estadoSanitizado) {
        return res.status(400).json({
          message: 'Estado inválido',
          allowed: estadosValidos
        });
      }
    }

    const pedidos = await Pedido.find(filtro)
      .populate('cliente')
      .populate('responsableCancelacion', 'username firstName surname')
      .populate('productos.product')
      .populate('cotizacionReferenciada', 'codigo')
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({ data: pedidos });
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    return res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
  }
};

exports.createPedido = async (req, res) => {
  try {
    const { cliente, productos, fechaAgendamiento, fechaEntrega, observacion, cotizacionReferenciada, cotizacionCodigo, descripcion, condicionesPago } = req.body;
    const clientePayload = req.body.cliente;

    let clienteId;
    try {
      clienteId = await resolveClienteId(cliente);
    } catch (error_) {
      return res.status(400).json({ message: error_.message || 'Falta información del cliente' });
    }

    const productosMapped = mapearProductos(productos);

    const counter = await Counter.findOneAndUpdate(
      { _id: 'pedido' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const numeroPedido = `PED-${String(counter.seq).padStart(5, '0')}`;

    const parseSafeDate = (value) => {
      if (!value) return new Date();
      const d = new Date(value);
      return (d instanceof Date && !Number.isNaN(d.getTime())) ? d : new Date();
    };
    const fechaAgSegura = parseSafeDate(fechaAgendamiento);
    const fechaEntSegura = parseSafeDate(fechaEntrega);

    const nuevoPedido = new Pedido({
      numeroPedido,
      cliente: clienteId,
      productos: productosMapped,
      fechaAgendamiento: fechaAgSegura,
      fechaEntrega: fechaEntSegura,
      descripcion: descripcion || '',
      condicionesPago: condicionesPago || '',
      observacion,
      cotizacionReferenciada,
      cotizacionCodigo
    });

    const pedidoGuardado = await savePedidoWithRetry(nuevoPedido);

    await safeMarkCotizacionAgendada(cotizacionReferenciada, pedidoGuardado._id, cotizacionCodigo);

    try {
      await applyPostPedidoClienteRules(clienteId, cotizacionReferenciada, clientePayload);
    } catch (error_) {
      console.warn('⚠️ Error aplicando reglas de cliente post-pedido (no bloqueante):', error_?.message || error_);
    }

    try {
      const pedidoPopulado = await Pedido.findById(pedidoGuardado._id)
        .populate('cliente')
        .populate('productos.product')
        .populate('cotizacionReferenciada', 'codigo')
        .exec();
      return res.status(201).json(pedidoPopulado || pedidoGuardado);
    } catch (error_) {
      console.warn('⚠️ No se pudo popular el pedido antes de responder, devolviendo el documento guardado:', error_?.message || error_);
      return res.status(201).json(pedidoGuardado);
    }
  } catch (err) {
    console.error('❌ Error al crear pedido:', err);
    return res.status(500).json({ message: 'Error al crear el pedido', error: err.message });
  }
};

exports.getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findById(id)
      .populate('cliente')
      .populate('productos.product')
      .populate('cotizacionReferenciada', 'codigo');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const total = pedido.productos.reduce((sum, prod) => {
      const cantidad = prod.cantidad || 0;
      const precio = prod.precioUnitario || 0;
      return sum + (cantidad * precio);
    }, 0);

    const pedidoObj = pedido.toObject();
    if (pedidoObj.cotizacionReferenciada && typeof pedidoObj.cotizacionReferenciada === 'object') {
      pedidoObj.cotizacionReferenciada = pedidoObj.cotizacionReferenciada.codigo || String(pedidoObj.cotizacionReferenciada._id);
    }

    const pedidoConTotal = {
      ...pedidoObj,
      total
    };

    res.status(200).json(pedidoConTotal);
  } catch (error) {
    console.error('❌ Error al obtener pedido por ID:', error);
    res.status(500).json({ message: 'Error al obtener el pedido', error });
  }
};

exports.remisionarPedido = async (req, res) => {
  try {
    const pedidoId = sanitizarId(req.params.id);
    const { fechaEntrega, observaciones } = req.body || {};

    const fechaEntregaParsed = parseFechaEntregaSafe(fechaEntrega);

    if (!pedidoId) return res.status(400).json({ message: 'ID de pedido inválido' });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .populate('cotizacionReferenciada', 'codigo')
      .exec();
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    console.log(`🧪 Intentando remisionar pedido ${pedido.numeroPedido} (${pedido._id}) estado=${pedido.estado}`);
    for (const p of pedido.productos) {
      const prodDoc = p.product || {};
      console.log(`🧪 Producto en pedido -> id=${prodDoc._id || p.product} nombre=${prodDoc.name || prodDoc.nombre || 'N/A'} stock=${prodDoc.stock} cantidadSolicitada=${p.cantidad}`);
    }

    if (pedido.estado && String(pedido.estado).toLowerCase() === 'entregado') {
      console.log('🔁 Pedido ya entregado previamente, saltando verificación de stock para evitar doble descuento.');
    } else {
      const stockResult = await updateStockIfEntregado(pedido);
      if (!stockResult.ok) {
        console.warn(`🛑 Remisionar abortado por stock insuficiente: ${stockResult.message}`);
        return res.status(stockResult.status || 400).json({ message: stockResult.message || 'Stock insuficiente', codigo: 'STOCK_INSUFICIENTE' });
      }
    }

    const counter = await Counter.findByIdAndUpdate('remision', { $inc: { seq: 1 } }, { new: true, upsert: true });
    const numeroRemision = `REM-${String(counter.seq).padStart(5, '0')}`;

    const productosRemisionDoc = buildProductosRemisionDoc(pedido);
    const total = productosRemisionDoc.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const cantidadTotal = productosRemisionDoc.reduce((s, p) => s + (Number(p.cantidad) || 0), 0);

    let clienteId;
    try {
      clienteId = await resolveClienteId(pedido.cliente);
    } catch (error_) {
      return res.status(400).json({ message: error_?.message || 'No se pudo resolver el cliente para crear la remisión' });
    }

    const RemisionModel = require('../models/Remision');

    const obsFinal = buildObsFinal(pedido, observaciones);
    const tieneCotRef = !!pedido.cotizacionReferenciada;

    const remisionData = {
      numeroRemision,
      pedidoReferencia: pedido._id,
      codigoPedido: pedido.numeroPedido,
      cliente: clienteId,
      productos: productosRemisionDoc,
      fechaRemision: new Date(),
      fechaEntrega: fechaEntregaParsed || new Date(),
      observaciones: obsFinal,
      responsable: req.userId || null,
      estado: 'activa',
      total,
      cantidadItems: productosRemisionDoc.length,
      cantidadTotal
    };

    if (tieneCotRef) {
      remisionData.cotizacionReferencia = (typeof pedido.cotizacionReferenciada === 'object')
        ? pedido.cotizacionReferenciada._id
        : pedido.cotizacionReferenciada;
      remisionData.cotizacionCodigo = (typeof pedido.cotizacionReferenciada === 'object')
        ? pedido.cotizacionReferenciada.codigo
        : String(pedido.cotizacionReferenciada);
    }

    const nuevaRemision = new RemisionModel(remisionData);
    await nuevaRemision.save();

    await updatePedidoFechaEntrega(pedido, fechaEntregaParsed);

    safeUpdatePedidoWithRemision(pedido, nuevaRemision._id, numeroRemision);

    const remisionCompleta = await RemisionModel.findById(nuevaRemision._id)
      .populate('responsable', 'username firstName surname')
      .populate('cliente');

    safeMarkCotizacionRemisionada(pedido.cotizacionReferenciada?._id || pedido.cotizacionReferenciada);

    const clienteRef = pedido.cliente?._id || pedido.cliente;
    await promoteClienteIfProspecto(clienteRef);

    return res.status(201).json({ message: 'Remisión creada exitosamente', remision: remisionCompleta, numeroRemision });
  } catch (error) {
    console.error('Error remisionando pedido:', error);
    return res.status(500).json({ message: 'Error al remisionar pedido', error: error.message });
  }
};

// Función auxiliar para enviar correos con adjuntos
async function enviarCorreoConAttachment(destinatario, asunto, htmlContent, pdfAttachment) {
  const useGmail = process.env.USE_GMAIL === 'true';
  const sendgridConfigured = process.env.SENDGRID_API_KEY?.startsWith('SG.');

  console.log('⚙️ Configuraciones disponibles:');
  console.log(`   SendGrid configurado: ${sendgridConfigured ? 'SÍ' : 'NO'}`);
  console.log(`   Usar Gmail prioritario: ${useGmail}`);

  if (useGmail) {
    try {
      console.log('📧 Enviando con Gmail centralizado...');
      const attachments = pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : [];
      await enviarConGmail(destinatario, asunto, htmlContent, attachments);
      console.log('✅ Correo enviado exitosamente con Gmail');
      return;
    } catch (error_) {
      console.error('❌ Error con Gmail:', error_?.message || error_);
      console.error('❌ Código de error Gmail:', error_?.code || 'N/A');
      console.error('❌ Detalles del error Gmail:', error_?.response || 'Sin detalles adicionales');
      console.log('🔄 Intentando con SendGrid como fallback...');
    }
  }

  if (sendgridConfigured) {
    try {
      console.log('📧 Enviando con SendGrid...');

      const msg = {
        to: destinatario,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || process.env.COMPANY_NAME || 'JLA Global Company'
        },
        subject: asunto,
        html: htmlContent,
        attachments: pdfAttachment ? [{
          content: pdfAttachment.content.toString('base64'),
          filename: pdfAttachment.filename,
          type: pdfAttachment.contentType,
          disposition: 'attachment'
        }] : []
      };

      await sgMail.send(msg);
      console.log('✅ Correo enviado exitosamente con SendGrid');
      return;

    } catch (sendError) {
      console.error('❌ Error con SendGrid:', sendError.message);
      console.error('❌ Código de error:', sendError.code);
      console.error('❌ Detalles del error:', JSON.stringify(sendError.response?.body, null, 2));
    }
  }

  console.log('⚠️ No se pudo enviar el correo (servicios no configurados)');
  throw new Error('Servicios de correo no configurados correctamente');
}

// Función para generar HTML profesional de pedidos agendados
function generarHTMLPedidoAgendado(pedido, mensaje = '') {
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
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
          border-radius: 0 0 8px 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
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
        @media (min-width: 768px) { 
          body { padding: 20px; }
          .header h1 { font-size: 2.5em; }
          .header p { font-size: 1.2em; }
          .container { margin: 20px auto; }
          .content { padding: 30px; }
          .info-grid { display: block; margin-bottom: 30px; }
          .info-card { padding: 20px; margin-bottom: 20px; }
          .info-card h3 { font-size: 1.3em; }
          .info-card p { font-size: 1em; }
          .products-title { padding: 20px; font-size: 1.3em; }
          .products-table thead { display: table-header-group; }
          .products-table tfoot { display: table-footer-group; }
          .products-table tr { display: table-row; border: none; margin: 0; padding: 0; background: transparent; }
          .products-table th, .products-table td { display: table-cell; padding: 12px; border-bottom: 1px solid #eee; text-align: left; position: static; }
          .products-table th { background: #fd7e14; color: white; font-weight: bold; text-align: center; }
          .products-table td { padding-left: 12px; }
          .products-table td:before { display: none; }
          .products-table td:nth-child(2), .products-table td:nth-child(3), .products-table td:nth-child(4) { text-align: center; }
          .products-table .total-row { background: #fff3e0 !important; border-top: 3px solid #fd7e14; font-size: 1.1em; }
          .alert-section { padding: 25px; }
          .alert-section h3 { font-size: 1.3em; }
          .alert-section p { font-size: 1.1em; }
          .message-section { padding: 25px; }
          .message-section h3 { font-size: 1.3em; }
          .message-section p { font-size: 1.1em; }
          .footer { padding: 25px; }
          .footer p { font-size: 1em; }
          .status-badge { font-size: 0.9em; }
          .mobile-total { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 PEDIDO AGENDADO</h1>
          <p>Confirmación de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">${pedido.estado?.toUpperCase() || 'AGENDADO'}</span>
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
              <p><strong>Número de Pedido:</strong> ${pedido.numeroPedido}</p>
              <p><strong>Fecha de Entrega:</strong> ${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> <span style="color: #fd7e14; font-weight: bold;">${(pedido.estado?.toUpperCase()) || 'AGENDADO'}</span></p>
              <p><strong>Cantidad Total de Productos:</strong> ${cantidadTotal} unidades</p>
              ${pedido.cotizacionCodigo ? '<p><strong>Cotización de Referencia:</strong> ' + pedido.cotizacionCodigo + '</p>' : ''}
            </div>
          </div>

          <div class="alert-section">
            <h3>⏰ Información Importante</h3>
            <p>Su pedido ha sido <strong>agendado</strong> para entrega el <strong>${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</strong>. Nos estaremos comunicando con usted próximamente para coordinar los detalles de la entrega. Por favor mantenga este número de pedido como referencia: <strong>${pedido.numeroPedido}</strong>.</p>
          </div>

          <div class="products-section">
            <div class="products-title">
              🛒 Productos Agendados (${cantidadTotal} unidades)
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
                      <td data-label="Precio Unit.:">$${precio.toLocaleString('es-ES')}</td>
                      <td data-label="Subtotal:">$${subtotal.toLocaleString('es-ES')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="" style="text-align: left; font-weight: bold;">TOTAL GENERAL</td>
                  <td data-label="">${cantidadTotal}</td>
                  <td data-label=""></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>$${totalCalculado.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <div class="mobile-total">
              💰 Total General: $${totalCalculado.toLocaleString('es-ES')}
            </div>
          </div>

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

// Función auxiliar para generar HTML de pedido cancelado
function generarHTMLPedidoCancelado(pedido, mensaje, motivoCancelacion) {
  const totalProductos = pedido.productos?.length || 0;
  const cantidadTotal = pedido.productos?.reduce((total, p) => total + (p.cantidad || 0), 0) || 0;
  const totalPedido = pedido.total || pedido.productos?.reduce((total, p) => total + ((p.cantidad || 0) * (p.precioUnitario || 0)), 0) || 0;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Cancelado ${pedido.numeroPedido}</title>
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
          background: linear-gradient(135deg, #dc3545, #c82333); 
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
        .content { 
          padding: 20px; 
        }
        .info-grid { 
          display: block;
          margin-bottom: 20px; 
        }
        .info-card { 
          background: #ffebee; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #dc3545; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #dc3545; 
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
          background: #dc3545; 
          color: white; 
          padding: 15px; 
          margin-bottom: 0; 
          border-radius: 8px 8px 0 0; 
          font-size: 1.2em; 
        }
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
          border-radius: 0 0 8px 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .products-table thead { 
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
          color: #dc3545; 
          font-size: 0.9em; 
        }
        .mobile-total {
          display: block;
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
          font-size: 1.2em;
          font-weight: bold;
        }
        .message-section { 
          background: linear-gradient(135deg, #6c757d, #5a6268); 
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
        .status-badge { 
          display: inline-block; 
          padding: 5px 12px; 
          border-radius: 20px; 
          font-size: 0.8em; 
          font-weight: bold; 
          text-transform: uppercase; 
          background: #dc3545; 
          color: white; 
        }
        @media (min-width: 768px) { 
          body { padding: 20px; }
          .header h1 { font-size: 2.5em; }
          .header p { font-size: 1.1em; }
          .content { padding: 30px; }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .info-card { padding: 20px; }
          .info-card h3 { font-size: 1.2em; }
          .info-card p { font-size: 1em; }
          .products-table thead { display: table-header-group; }
          .products-table tr { 
            display: table-row; 
            border: none; 
            margin-bottom: 0; 
            border-radius: 0; 
            padding: 0; 
          }
          .products-table td { 
            display: table-cell; 
            padding: 15px; 
            border-bottom: 1px solid #eee; 
            padding-left: 15px; 
          }
          .products-table td:before { display: none; }
          .products-table th { 
            background: #c82333; 
            color: white; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { background: #ffebee; }
          .mobile-total { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ PEDIDO CANCELADO</h1>
          <p>Documento de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">CANCELADO</span>
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
              <p><strong>Fecha Original:</strong> ${new Date(pedido.createdAt).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Estado:</strong> Cancelado</p>
              <p><strong>Responsable:</strong> Sistema</p>
              <p><strong>Items:</strong> ${totalProductos} productos</p>
              <p><strong>Cantidad Total:</strong> ${cantidadTotal} unidades</p>
              ${motivoCancelacion ? '<p><strong>Motivo de Cancelación:</strong> ' + motivoCancelacion + '</p>' : ''}
            </div>
          </div>

          <div class="products-section">
            <h2 class="products-title">🛍️ Productos Cancelados</h2>
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
                      <strong>${producto.product?.name || producto.product?.nombre || producto.descripcion || 'Producto sin nombre'}</strong>
                      ${producto.product?.codigo ? '<br><small style="color: #666;">Código: ' + producto.product.codigo + '</small>' : ''}
                    </td>
                    <td data-label="Cantidad:" style="text-align: center; font-weight: bold;">${producto.cantidad || 0}</td>
                    <td data-label="Precio Unit.:" style="text-align: right;">$${(producto.precioUnitario || 0).toLocaleString('es-ES')}</td>
                    <td data-label="Total:" style="text-align: right; font-weight: bold;">$${((producto.cantidad || 0) * (producto.precioUnitario || 0)).toLocaleString('es-ES')}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No hay productos</td></tr>'}
              </tbody>
            </table>
            
            <div class="mobile-total">
              💰 Total General: $${totalPedido.toLocaleString('es-ES')}
            </div>
          </div>

          <div class="message-section">
            <h3>💬 Mensaje</h3>
            <p>${mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, le informamos que su pedido ha sido cancelado. Lamentamos cualquier inconveniente que esto pueda causar. Encontrará adjunto el documento con los detalles del pedido cancelado. Para cualquier consulta sobre esta cancelación, no dude en contactarnos.`}</p>
          </div>

          ${pedido.observaciones ? `
          <div class="info-card" style="margin-top: 20px;">
            <h3>📝 Observaciones</h3>
            <p>${pedido.observaciones}</p>
          </div>
          ` : ''}
        </div>

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

// Función auxiliar para generar HTML de remisión
function generarHTMLRemision(pedido, numeroRemision, mensaje = '') {
  const totalCalculado = pedido.productos.reduce((total, producto) => {
    const precio = Number(producto.product?.price) || 0;
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
      <title>Remisión ${numeroRemision || pedido.numeroPedido}</title>
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
          background: linear-gradient(135deg, #28a745, #20c997); 
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
          border-left: 4px solid #28a745; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #28a745; 
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
          background: #28a745; 
          color: white; 
          padding: 15px; 
          margin-bottom: 0; 
          border-radius: 8px 8px 0 0; 
          font-size: 1.2em; 
        }
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
          border-radius: 0 0 8px 8px; 
          overflow: hidden; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  }
                  .products-table thead { 
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
                    color: #28a745; 
                    font-size: 0.9em; 
                  }
                  .mobile-total {
                    display: block;
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    text-align: center;
                    font-size: 1.2em;
                    font-weight: bold;
                  }
                  .message-section { 
                    background: linear-gradient(135deg, #17a2b8, #138496); 
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
                  @media (min-width: 768px) { 
                    body { padding: 20px; }
                    .header h1 { font-size: 2.5em; }
                    .content { padding: 30px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                    .products-table thead { display: table-header-group; }
                    .products-table tr { display: table-row; border: none; margin: 0; padding: 0; }
                    .products-table td { display: table-cell; padding: 15px; border-bottom: 1px solid #eee; padding-left: 15px; }
                    .products-table td:before { display: none; }
                    .products-table th { background: #28a745; color: white; padding: 15px; text-align: center; }
                    .mobile-total { display: none; }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📦 REMISIÓN</h1>
                    <p>Documento No. <strong>${numeroRemision || pedido.numeroPedido}</strong></p>
                    <span class="status-badge">ENTREGADO</span>
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
                        <p><strong>Remisión:</strong> ${numeroRemision || pedido.numeroPedido}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                        <p><strong>Total Items:</strong> ${cantidadTotal}</p>
                      </div>
                    </div>
                    <div class="products-section">
                      <div class="products-title">Productos (${cantidadTotal} unidades)</div>
                      <table class="products-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${pedido.productos.map(p => {
                            const precio = Number(p.product?.price) || 0;
                            const cantidad = Number(p.cantidad) || 0;
                            return `<tr>
                              <td data-label="Producto:">${p.product?.name || 'N/A'}</td>
                              <td data-label="Cantidad:">${cantidad}</td>
                              <td data-label="Precio:">$${precio.toLocaleString('es-ES')}</td>
                              <td data-label="Subtotal:">$${(precio * cantidad).toLocaleString('es-ES')}</td>
                            </tr>`;
                          }).join('')}
                        </tbody>
                      </table>
                      <div class="mobile-total">Total: $${totalCalculado.toLocaleString('es-ES')}</div>
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
          }
