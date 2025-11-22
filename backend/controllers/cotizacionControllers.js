const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Products');
const Product = require('../models/Products'); // Ensure both references work
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const PDFService = require('../services/pdfService');
const crypto = require('node:crypto');
const { sendMail } = require('../utils/emailSender');

const { validationResult } = require('express-validator');
const { normalizeCotizacionProductos } = require('../utils/normalize');

// Configurar SendGrid de forma segura para no bloquear el arranque
try {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey?.startsWith('SG.')) {
    sgMail.setApiKey(apiKey);
    console.log('✉️  SendGrid listo (cotizaciones)');
  } else {
    console.log('✉️  SendGrid no configurado (cotizaciones): se omitirá hasta el envío');
  }
} catch (e) {
  console.warn('⚠️  No se pudo inicializar SendGrid (cotizaciones). Continuando sin correo:', e.message);
}

// Gmail sending is centralized in backend/utils/gmailSender.js (enviarConGmail)

// Helper: validate responsible id and client email, return sanitized email
function validateBasicInputs(responsable, cliente) {
  if (!/^[0-9a-fA-F]{24}$/.exec(responsable?.id)) {
    return { error: 'El responsable debe ser el id del usuario registrado.' };
  }
  if (!cliente?.correo) {
    return { error: 'Datos de cliente inválidos' };
  }
  const correoSanitizado = typeof cliente?.correo === 'string' ? cliente.correo.toLowerCase().trim() : '';
  if (!correoSanitizado?.includes('@')) {
    return { error: 'Correo electrónico inválido' };
  }
  return { correoSanitizado };
}

// Helper (module-scope): try to find a cliente by correo
async function findClienteByCorreo(correoSanitizado) {
  try {
    const clienteExistente = await Cliente.findOne({ correo: correoSanitizado });
    if (!clienteExistente) return null;

    // Normalize some fields to ensure predictable shape
    clienteExistente.esCliente = !!clienteExistente.esCliente;
    clienteExistente.operacion = clienteExistente.operacion || 'compra';

    return clienteExistente;
  } catch (err) {
    console.warn('Error buscando cliente por correo:', err?.message || err);
    return null;
  }
}

// Try to find a cliente by searching delivered Pedidos that reference a cliente with this correo
async function findClienteFromDeliveredPedido(correoSanitizado) {
  try {
    const Pedido = require('../models/Pedido');
    const resultado = await Pedido.aggregate([
      { $match: { estado: 'entregado' } },
      { $lookup: { from: 'clientes', localField: 'cliente', foreignField: '_id', as: 'cli' } },
      { $unwind: '$cli' },
      { $match: { 'cli.correo': correoSanitizado } },
      { $limit: 1 }
    ]);

    if (!Array.isArray(resultado) || resultado.length === 0) return null;
    const cliRef = resultado[0].cli;
    if (!cliRef?._id) return null;

    const clienteExistente = await Cliente.findById(cliRef._id);
    if (!clienteExistente) return null;

    const updates = {};
    if (!clienteExistente.esCliente) updates.esCliente = true;
    if (clienteExistente.operacion !== 'compra') updates.operacion = 'compra';
    if (Object.keys(updates).length) {
      try {
        await Cliente.findByIdAndUpdate(clienteExistente._id, updates);
        Object.assign(clienteExistente, updates);
      } catch (error_) {
        console.warn('No se pudo actualizar cliente desde pedido entregado:', error_?.message || error_);
      }
    }
    return clienteExistente;
  } catch (err) {
    console.warn('No se pudo verificar pedidos entregados por correo:', err?.message || err);
    return null;
  }
}

// Create a prospect client document when no existing cliente is found
async function createProspectCliente(correoSanitizado, clientePayload = {}) {
  try {
    const nuevoCliente = new Cliente({
      nombre: clientePayload.nombre || '',
      ciudad: clientePayload.ciudad || '',
      direccion: clientePayload.direccion || '',
      telefono: clientePayload.telefono || '',
      correo: correoSanitizado,
      esCliente: false,
      operacion: 'cotiza'
    });
    await nuevoCliente.save();
    return nuevoCliente;
  } catch (err) {
    console.warn('No se pudo crear cliente prospecto:', err?.message || err);
    return null;
  }

}

// Helper (module-scope): find existing cliente or create/prospect based on delivered pedidos
async function findOrCreateClienteByCorreo(correoSanitizado, clientePayload) {
  // 1) Try direct find
  const direct = await findClienteByCorreo(correoSanitizado);
  if (direct) return direct;

  // 2) Try to resolve from delivered Pedido
  const fromPedido = await findClienteFromDeliveredPedido(correoSanitizado);
  if (fromPedido) return fromPedido;

  // 3) Fallback: create prospect
  return createProspectCliente(correoSanitizado, clientePayload);
}

// Crear cotización

// Helper: generate code (moved to module scope to avoid nested function)
function generarCodigoCotizacion() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 4;
  let codigo = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, chars.length);
    codigo += chars.charAt(idx);
  }
  return `COT-${codigo}`;
}

// Helper: map productos to include product name if available (module scope)
async function mapProductosConNombre(productos = []) {
  return Promise.all(productos.map(async (prod) => {
    let productoInfo = null;
    if (prod.producto?.id) {
      productoInfo = await Producto.findById(prod.producto.id).lean();
    }
    return {
      producto: {
        id: prod.producto?.id,
        name: productoInfo ? productoInfo.name : prod.producto?.name
      },
      descripcion: prod.descripcion,
      cantidad: prod.cantidad,
      valorUnitario: prod.valorUnitario,
      descuento: prod.descuento,
      subtotal: prod.subtotal
    };
  }));
}

// Crear cotización
// Helper: parse various incoming fecha formats into a UTC date at midnight and its YYYY-MM-DD string
function parseFechaCotizacion(fecha) {
  let fechaStringVal;
  let fechaCotizacion;

  // Prioritize Date instance
  if (fecha instanceof Date) {
    fechaStringVal = fecha.toISOString().slice(0, 10);
  } else {
    // Normalize incoming value to string for simple checks
    const asStr = (typeof fecha === 'string') ? fecha : (fecha == null ? '' : String(fecha));

    // Exact match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(asStr)) {
      fechaStringVal = asStr;
    } else if (asStr.length >= 10) {
      // Try first 10 chars (handles ISO-like strings)
      const maybe = asStr.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybe)) {
        fechaStringVal = maybe;
      }
    }
  }

  if (fechaStringVal) {
    const [y, m, d] = fechaStringVal.split('-').map(n => parseInt(n, 10));
    fechaCotizacion = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  } else {
    // Fallback to today's UTC date at midnight
    const now = new Date();
    fechaCotizacion = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    fechaStringVal = fechaCotizacion.toISOString().slice(0, 10);
  }

  return { fechaCotizacion, fechaStringVal };
}

// Helper: validate that fechaCotizacion is not older than allowed window (24h tolerance)
function isFechaAllowed(fechaCotizacion) {
  const now = new Date();
  const todayUtcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
  const allowedStart = todayUtcStart - (24 * 60 * 60 * 1000); // 24h atrás
  return fechaCotizacion.getTime() >= allowedStart;
}

// Helper: build payload for Cotizacion document
function buildCotizacionPayload({
  clienteExistente,
  cliente,
  responsable,
  fechaCotizacion,
  fechaStringVal,
  descripcion,
  condicionesPago,
  productosConNombre,
  enviadoCorreo,
  empresa,
  clientePotencial
}) {
  return {
    codigo: generarCodigoCotizacion(),
    cliente: {
      referencia: clienteExistente ? clienteExistente._id : undefined,
      nombre: cliente.nombre,
      ciudad: cliente.ciudad,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
      esCliente: cliente.esCliente
    },
    responsable: {
      id: responsable.id,
      firstName: responsable.firstName,
      secondName: responsable.secondName,
      surname: responsable.surname,
      secondSurname: responsable.secondSurname
    },
    fecha: fechaCotizacion,
    fechaString: fechaStringVal,
    descripcion,
    condicionesPago,
    productos: productosConNombre,
    empresa: empresa || undefined,
    clientePotencial,
    enviadoCorreo
  };
}

exports.createCotizacion = async (req, res) => {
  try {
    const {
      cliente,
      clientePotencial,
      fecha,
      descripcion,
      condicionesPago,
      productos,
      responsable,
      enviadoCorreo
    } = req.body;

    // DEBUG: mostrar lo que llega en `fecha` para depuración
    console.log('DEBUG createCotizacion - incoming fecha (type):', typeof fecha, 'value:', fecha);

    // Basic validations and email sanitization
    const validated = validateBasicInputs(responsable, cliente);
    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }
    const correoSanitizado = validated.correoSanitizado;

    // Resolve or create cliente document
    const clienteExistente = await findOrCreateClienteByCorreo(correoSanitizado, cliente);

    // Parse and normalize fecha
    const { fechaCotizacion, fechaStringVal } = parseFechaCotizacion(fecha);

    // DEBUG: valores calculados
    console.log('DEBUG createCotizacion - fechaStringVal:', fechaStringVal, 'fechaCotizacion:', fechaCotizacion.toISOString());

    // Validate date allowed
    if (!isFechaAllowed(fechaCotizacion)) {
      return res.status(400).json({ message: 'La fecha de la cotización no puede ser anterior a la fecha de hoy.' });
    }

    // Map productos (fetch names if available)
    const productosConNombre = await mapProductosConNombre(productos);

    // Build and save cotización
    const cotizacionPayload = buildCotizacionPayload({
      clienteExistente,
      cliente,
      responsable,
      fechaCotizacion,
      fechaStringVal,
      descripcion,
      condicionesPago,
      productosConNombre,
      enviadoCorreo,
      empresa: req.body.empresa,
      clientePotencial
    });

    const cotizacion = new Cotizacion(cotizacionPayload);
    await cotizacion.save();

    // Populate cliente reference for response
    const cotizacionConCliente = await Cotizacion.findById(cotizacion._id)
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente');

    return res.status(201).json({ message: 'Cotización creada', data: cotizacionConCliente });
  } catch (error) {
    console.error('❌ Error al crear cotización:', error);
    return res.status(500).json({ message: 'Error al crear cotización', error: error.message });
  }
};


// Obtener todas las cotizaciones
exports.getCotizaciones = async (req, res) => {
  try {
    // First, try to get cotizaciones without populate to avoid casting errors
    let cotizaciones;
    
    try {
      cotizaciones = await Cotizacion.find()
        .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
        .populate({
          path: 'productos.producto.id',
          model: 'Product',
          select: 'name price description',
          options: { strictPopulate: false } // Allow population even if some refs are missing
        })
        .sort({ createdAt: -1 });
    } catch (populateError) {
      console.warn('Error with populate, fetching without product population:', populateError.message);
      
      // Fallback: get cotizaciones without product population
      cotizaciones = await Cotizacion.find()
        .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
        .sort({ createdAt: -1 });
    }

    // Normalize product entries for each cotización
    const processedCotizaciones = cotizaciones.map(cotizacion => {
      const cotObj = (typeof cotizacion.toObject === 'function') ? cotizacion.toObject() : structuredClone(cotizacion);
      cotObj.productos = normalizeCotizacionProductos(cotObj.productos);
      return cotObj;
    });

    res.json(processedCotizaciones);
  } catch (err) {
    console.error('[ERROR getCotizaciones]', err);
    
    // Handle specific casting errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ 
        message: 'Error en formato de datos de las cotizaciones',
        error: 'CAST_ERROR'
      });
    }
    
    res.status(500).json({ message: 'Error al obtener cotizaciones' });
  }
};


// Obtener cotización por ID
exports.getCotizacionById = async (req, res) => {
  try {
    // Sanitizar y validar el ID para prevenir inyección NoSQL
    const cotizacionId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.exec(cotizacionId)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    let cotizacion = await Cotizacion.findById(cotizacionId)
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
      .populate({
        path: 'productos.producto.id',
        model: 'Product',
        select: 'name price description'
      });

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Flatten populated product data for easier frontend consumption using helper
    const cotObj = (typeof cotizacion.toObject === 'function') ? cotizacion.toObject() : structuredClone(cotizacion);
    cotObj.productos = normalizeCotizacionProductos(cotObj.productos);

    res.status(200).json({ data: cotObj });
  } catch (error) {
    console.error('Error al obtener cotización por ID:', error);
    res.status(500).json({ message: 'Error al obtener cotización', error: error.message });
  }
};

// Actualizar cotización
exports.updateCotizacion = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errors: errores.array() });
  }

  try {
    // Sanitizar y validar el ID para prevenir inyección NoSQL
    const cotizacionId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    
    if (!/^[0-9a-fA-F]{24}$/.exec(cotizacionId)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    // No permitir cambiar el código ni el _id
    const { codigo, _id, ...rest } = req.body;

    // Si se actualiza cliente, actualizar también en la colección Cliente
    if (rest.cliente?.referencia) {
      const clienteId = rest.cliente.referencia;
      // Solo actualiza si hay datos nuevos
      await Cliente.findByIdAndUpdate(
        clienteId,
        {
          nombre: rest.cliente.nombre,
          ciudad: rest.cliente.ciudad,
          direccion: rest.cliente.direccion,
          telefono: rest.cliente.telefono,
          correo: rest.cliente.correo,
          esCliente: rest.cliente.esCliente
        },
        { new: true }
      );
    }

    // Si se intenta cambiar la fecha desde el cliente, normalizar y validar
    if (rest.fecha || rest.fechaString) {
      const fechaRaw = rest.fechaString || rest.fecha;
      // DEBUG: mostrar dato entrante al intentar actualizar la fecha
      console.log('DEBUG updateCotizacion - incoming fechaRaw:', fechaRaw, 'rest.fecha (type):', typeof rest.fecha, 'rest.fechaString:', rest.fechaString);
      if (typeof fechaRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
        const [yy, mm, dd] = fechaRaw.split('-').map(n => parseInt(n, 10));
        const candidateDate = new Date(Date.UTC(yy, mm - 1, dd, 0, 0, 0));
        const candidateFechaString = fechaRaw;

        const now = new Date();
        const todayUtcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
        const allowedStart = todayUtcStart - (24 * 60 * 60 * 1000); // permitir 24h de tolerancia
        if (candidateDate.getTime() < allowedStart) {
          return res.status(400).json({ message: 'No se puede actualizar la cotización a una fecha anterior a hoy.' });
        }

        rest.fecha = candidateDate;
        rest.fechaString = candidateFechaString;
        console.log('DEBUG updateCotizacion - set fechaString:', rest.fechaString, 'fecha:', rest.fecha.toISOString());
      } else if (rest.fecha && !Number.isNaN(new Date(rest.fecha).getTime())) {
        const tmp = new Date(rest.fecha);
        // Usar componentes UTC para evitar shifts por zona horaria
        const candidateDate = new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0));
        // Validación con tolerancia de 24h
        const now2 = new Date();
        const todayUtcStart2 = Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate(), 0, 0, 0);
        const allowedStart2 = todayUtcStart2 - (24 * 60 * 60 * 1000);
        if (candidateDate.getTime() < allowedStart2) {
          return res.status(400).json({ message: 'No se puede actualizar la cotización a una fecha anterior a hoy.' });
        }
        rest.fecha = candidateDate;
        rest.fechaString = candidateDate.toISOString().slice(0, 10);
        console.log('DEBUG updateCotizacion - set fechaString(from Date):', rest.fechaString, 'fecha:', rest.fecha.toISOString());
      }
    }

    const cotizacion = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      rest,
      { new: true }
    );
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
    res.status(200).json({ message: 'Cotización actualizada', data: cotizacion });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cotización', error: error.message });
  }
};

// Eliminar cotización
exports.deleteCotizacion = async (req, res) => {
  try {
    // Sanitizar y validar el ID para prevenir inyección NoSQL
    const cotizacionId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    
    if (!/^[0-9a-fA-F]{24}$/.exec(cotizacionId)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    // Primero obtenemos la cotización para comprobar su antigüedad
    const cotizacion = await Cotizacion.findById(cotizacionId);
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });

    // Determinar fecha base: preferir createdAt (timestamps), si no existe usar fecha
    const fechaBase = cotizacion.createdAt || cotizacion.fecha || null;
    if (!fechaBase) {
      // Si no hay fecha, denegar eliminación por seguridad
      return res.status(400).json({ message: 'Imposible determinar la fecha de la cotización' });
    }

    const now = new Date();
    const ageMs = now.getTime() - new Date(fechaBase).getTime();
    const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const minDays = 15;

    if (daysOld < minDays) {
      const daysRemaining = minDays - daysOld;
      return res.status(403).json({ message: `No es posible eliminar la cotización. Deben pasar al menos ${minDays} días desde su creación. Faltan ${daysRemaining} día(s).` });
    }

    // Si cumple la condición, eliminar definitivamente
    await Cotizacion.findByIdAndDelete(cotizacionId);
    return res.status(200).json({ message: 'Cotización eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cotización', error: error.message });
  }
};

// Cambiar estado de cotización
exports.updateEstadoCotizacion = async (req, res) => {
  const { estado } = req.body;
  try {
    // Sanitizar y validar el ID para prevenir inyección NoSQL
    const cotizacionId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    
    if (!/^[0-9a-fA-F]{24}$/.exec(cotizacionId)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    const cotizacion = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      { estado },
      { new: true }
    );
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
    res.status(200).json({ message: 'Estado actualizado', data: cotizacion });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};


exports.getUltimaCotizacionPorCliente = async (req, res) => {
  const { cliente } = req.query;

  try {
    // Sanitizar y validar el ID del cliente para prevenir inyección NoSQL
    const clienteId = typeof cliente === 'string' ? cliente.trim() : '';
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.exec(clienteId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    let cotizacion = await Cotizacion.findOne({ 'cliente.referencia': clienteId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'productos.producto.id',
        model: 'Product',
        select: 'name price description'
      })
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente');

    if (!cotizacion) return res.status(404).json({ message: 'No hay cotización' });

    const cotObj = (typeof cotizacion.toObject === 'function') ? cotizacion.toObject() : structuredClone(cotizacion);
    cotObj.productos = normalizeCotizacionProductos(cotObj.productos);

    res.json({ data: cotObj });
  } catch (error) {
    console.error('[ERROR getUltimaCotizacionPorCliente]', error);
    res.status(500).json({ message: 'Error al obtener la cotización' });
  }
};

// Helper: validate and return trimmed ObjectId or null
function validateObjectId(raw) {
  const id = typeof raw === 'string' ? raw.trim() : '';
  return /^[0-9a-fA-F]{24}$/.exec(id) ? id : null;
}

// Helper: fetch cotizacion with necessary populations
async function fetchCotizacion(cotizacionId) {
  return Cotizacion.findById(cotizacionId)
    .populate('cliente.referencia', 'nombre correo ciudad telefono')
    .populate({
      path: 'productos.producto.id',
      model: 'Product',
      select: 'name price description'
    });
}

// Helper: generate PDF attachment or null
async function generatePdfAttachmentSafe(cotizacion) {
  try {
    console.log('📄 Generando PDF de la cotización...');
    const pdfService = new PDFService();
    const pdfData = await pdfService.generarPDFCotizacion(cotizacion);
    console.log('✅ PDF generado exitosamente:', pdfData.filename);
    return {
      filename: pdfData.filename,
      content: pdfData.buffer,
      contentType: pdfData.contentType
    };
  } catch (err) {
    console.error('⚠️ Error generando PDF:', err.message);
    return null; // continue without PDF
  }
}

async function markCotizacionAsSent(id) {
  try {
    await Cotizacion.findByIdAndUpdate(id, { enviadoCorreo: true });
  } catch (err) {
    console.warn('No se pudo marcar cotización como enviada:', err.message);
  }
}

// Gmail sending uses the centralized enviarConGmail helper in ../utils/gmailSender

async function trySendWithSendGrid(destinatario, asuntoFinal, mensajeFinal, htmlCompleto, pdfAttachment) {
  if (!process.env.SENDGRID_API_KEY?.startsWith('SG.')) return { ok: false };
  try {
    const msg = {
      to: destinatario,
      from: { email: process.env.SENDGRID_FROM_EMAIL, name: process.env.SENDGRID_FROM_NAME },
      subject: asuntoFinal,
      text: mensajeFinal,
      html: htmlCompleto,
      attachments: pdfAttachment ? [{ content: pdfAttachment.content.toString('base64'), filename: pdfAttachment.filename, type: pdfAttachment.contentType, disposition: 'attachment' }] : []
    };
    await sgMail.send(msg);
    return { ok: true, metodo: 'SendGrid' };
  } catch (err) {
    console.error('❌ Error con SendGrid:', err.message);
    return { ok: false, error: err };
  }
}

exports.enviarCotizacionPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body;
    const cotizacionId = validateObjectId(req.params.id);
    if (!cotizacionId) return res.status(400).json({ message: 'ID de cotización inválido' });

    console.log('🔍 Iniciando envío de correo para cotización:', cotizacionId);
    console.log('📧 Datos de envío:', { correoDestino, asunto });

    const cotizacion = await fetchCotizacion(cotizacionId);
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });

    const destinatario = correoDestino || cotizacion.cliente.correo;
    const asuntoFinal = asunto || `Cotización ${cotizacion.codigo} - JLA Global Company`;
    const mensajeFinal = mensaje || `Nos complace enviarle la cotización ${cotizacion.codigo}. Esperamos que sea de su interés y quedamos atentos a sus comentarios.`;
    const htmlCompleto = generarHTMLCotizacion(cotizacion);

    const pdfAttachment = await generatePdfAttachmentSafe(cotizacion);

    // Show debug info
    console.log('📊 Datos de cotización para HTML:', { total: cotizacion.total, productos: cotizacion.productos?.length || 0 });

    const useGmail = process.env.USE_GMAIL === 'true';

    // Try Gmail first if configured using centralized helper
    if (useGmail) {
      try {
        const attachments = pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : [];
        await sendMail(destinatario, asuntoFinal, htmlCompleto, attachments);
        await markCotizacionAsSent(cotizacionId);
        return res.status(200).json({ message: '¡Cotización enviada por correo exitosamente!', details: { destinatario, asunto: asuntoFinal, enviado: true, metodo: 'Gmail SMTP', fecha: new Date().toLocaleString('es-CO') } });
      } catch (error_) {
        console.log('🔄 Intentando con SendGrid como fallback... Gmail error:', error_?.message || error_);
      }
    }

    // Try SendGrid
    const sendgridResult = await trySendWithSendGrid(destinatario, asuntoFinal, mensajeFinal, htmlCompleto, pdfAttachment);
    if (sendgridResult.ok) {
      await markCotizacionAsSent(cotizacionId);
      return res.status(200).json({ message: '¡Cotización enviada por correo exitosamente!', details: { destinatario, asunto: asuntoFinal, enviado: true, metodo: sendgridResult.metodo, fecha: new Date().toLocaleString('es-CO') } });
    }

    // If both fail, simulate send and mark as sent
    console.log('📧 SIMULACIÓN DE ENVÍO (servicios de correo no disponibles):', { destinatario, asunto: asuntoFinal });
    await markCotizacionAsSent(cotizacionId);
    return res.status(200).json({ message: 'Envío simulado (servicios de correo no disponibles)', details: { destinatario, asunto: asuntoFinal, simulado: true, nota: 'Configure Gmail o SendGrid correctamente para envío real' } });

  } catch (error) {
    console.error('💥 Error general:', error);
    res.status(500).json({ message: 'Error interno al procesar el envío', error: error.message });
  }
};

// Función auxiliar para generar HTML de cotización
function generarHTMLCotizacion(cotizacion) {
  // Calcular el total sumando todos los subtotales
  const totalCalculado = cotizacion.productos.reduce((total, producto) => {
    const subtotal = Number(producto.subtotal) || 0;
    return total + subtotal;
  }, 0);
  
  // Usar el total calculado si no existe en la cotización o es inválido
  const totalOriginal = Number(cotizacion.total) || 0;
  const totalFinal = totalOriginal > 0 ? totalOriginal : totalCalculado;
  
  console.log('💰 Total calculado para HTML:', {
    totalOriginal: cotizacion.total,
    totalCalculado: totalCalculado,
    totalFinal: totalFinal,
    productos: cotizacion.productos.length
  });

  // Validar que totalFinal sea un número válido
  const totalSeguro = Number(totalFinal) || 0;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización ${cotizacion.codigo}</title>
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
          background: linear-gradient(135deg, #007bff, #0056b3); 
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
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #007bff; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #007bff; 
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
          background: #007bff; 
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
          color: #007bff; 
          font-size: 0.9em; 
        }
        
        .total-row { 
          background: #e3f2fd !important; 
          font-weight: bold; 
          border: 2px solid #007bff !important; 
        }
        
        .total-row td { 
          color: #007bff; 
          font-size: 1.1em; 
        }
        
        .total-row td:before { 
          color: #007bff; 
        }
        
        /* Mobile total summary */
        .mobile-total {
          display: block;
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
          font-size: 1.2em;
          font-weight: bold;
        }
        
        .message-section { 
          background: linear-gradient(135deg, #28a745, #20c997); 
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
          background: #28a745; 
          color: white; 
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
            font-size: 1.1em; 
          }
          .content { 
            padding: 30px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .info-card { 
            padding: 20px; 
          }
          .info-card h3 { 
            font-size: 1.2em; 
          }
          .info-card p { 
            font-size: 1em; 
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
          .products-table td:before { 
            display: none; 
          }
          .products-table th { 
            background: #0056b3; 
            color: white; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { 
            background: #f8f9fa; 
          }
          .total-row td { 
            border-top: 3px solid #007bff; 
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
          <h1>📄 COTIZACIÓN</h1>
          <p>Documento de cotización No. <strong>${cotizacion.codigo}</strong></p>
          <span class="status-badge">${cotizacion.estado?.toUpperCase() || 'ACTIVA'}</span>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Cliente -->
            <div class="info-card">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${cotizacion.cliente?.nombre || 'N/A'}</p>
              <p><strong>Correo:</strong> ${cotizacion.cliente?.correo || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${cotizacion.cliente?.telefono || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${cotizacion.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> ${cotizacion.cliente?.ciudad || 'N/A'}</p>
            </div>

            <!-- Detalles de la Cotización -->
            <div class="info-card">
              <h3>📋 Detalles de la Cotización</h3>
              <p><strong>Fecha:</strong> ${new Date(cotizacion.fecha).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Estado:</strong> ${cotizacion.estado || 'activa'}</p>
              <p><strong>Responsable:</strong> ${cotizacion.responsable?.firstName || ''} ${cotizacion.responsable?.surname || ''}</p>
              <p><strong>Validez:</strong> ${cotizacion.validez || '15 días'}</p>
              <p><strong>Items:</strong> ${cotizacion.productos?.length || 0} productos</p>
              <p><strong>Cantidad Total:</strong> ${cotizacion.productos.reduce((total, p) => total + (p.cantidad || 0), 0)} unidades</p>
            </div>
          </div>

          <!-- Products Section -->
          <div class="products-section">
            <h2 class="products-title">🛍️ Productos Cotizados</h2>
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
                ${cotizacion.productos.map((producto, index) => `
                  <tr>
                    <td data-label="Producto:">
                      <strong>${producto.producto?.name || 'Producto'}</strong>
                      ${producto.producto?.codigo ? `<br><small style="color: #666;">Código: ${producto.producto.codigo}</small>` : ''}
                    </td>
                    <td data-label="Cantidad:" style="text-align: center; font-weight: bold;">${producto.cantidad || 0}</td>
                    <td data-label="Precio Unit.:" style="text-align: right;">$${(producto.valorUnitario || 0).toLocaleString('es-ES')}</td>
                    <td data-label="Total:" style="text-align: right; font-weight: bold;">$${(producto.subtotal || 0).toLocaleString('es-ES')}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="TOTAL:" colspan="3" style="text-align: right; font-size: 1.2em;">💰 <strong>TOTAL GENERAL:</strong></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>$${totalSeguro.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Mobile Total Summary -->
            <div class="mobile-total">
              💰 Total General: $${totalSeguro.toLocaleString('es-ES')}
            </div>
          </div>

          <!-- Message Section -->
          <div class="message-section">
            <h3>💬 Mensaje</h3>
            <p>Estimado/a ${cotizacion.cliente?.nombre || 'Cliente'}, esperamos que se encuentre muy bien.<br><br>
            Adjunto encontrará el documento de la cotización solicitada con todos sus detalles.<br><br>
            ⚠ Esta cotización tiene una validez de ${cotizacion.validez || '15 días'} a partir de la fecha de emisión. Quedamos atentos a sus comentarios y/o respuesta.</p>
          </div>

          ${cotizacion.observaciones ? `
          <!-- Observaciones -->
          <div class="info-card" style="margin-top: 20px;">
            <h3>📝 Observaciones</h3>
            <p>${cotizacion.observaciones}</p>
          </div>
          ` : ''}
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

// Helper: generate remision number
async function generarNumeroRemision() {
  const Counter = require('../models/Counter');
  const counter = await Counter.findByIdAndUpdate(
    'remision',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `REM-${String(counter.seq).padStart(5, '0')}`;
}

// Helper: map cotizacion productos to remision format
function mapearProductosRemision(productos) {
  return (productos || []).map(prod => ({
    nombre: prod.producto?.name || prod.nombre || 'Producto sin nombre',
    cantidad: prod.cantidad || 0,
    precioUnitario: prod.valorUnitario || prod.precioUnitario || 0,
    total: (prod.cantidad || 0) * (prod.valorUnitario || prod.precioUnitario || 0),
    descripcion: prod.descripcion || prod.producto?.description || '',
    codigo: prod.producto?.codigo || prod.codigo || ''
  }));
}

// Helper: resolve or create cliente from cotizacion
async function resolverClienteId(cotizacion) {
  if (cotizacion.cliente?.referencia) {
    return (typeof cotizacion.cliente.referencia === 'object') 
      ? (cotizacion.cliente.referencia._id || cotizacion.cliente.referencia) 
      : cotizacion.cliente.referencia;
  }

  const correo = cotizacion.cliente?.correo ? String(cotizacion.cliente.correo).toLowerCase().trim() : null;
  if (!correo) return null;

  let clienteExistente = await Cliente.findOne({ correo });
  if (!clienteExistente) {
    clienteExistente = new Cliente({
      nombre: cotizacion.cliente?.nombre || '',
      ciudad: cotizacion.cliente?.ciudad || '',
      direccion: cotizacion.cliente?.direccion || '',
      telefono: cotizacion.cliente?.telefono || '',
      correo: correo,
      esCliente: true
    });
    await clienteExistente.save();
  }
  return clienteExistente._id;
}

// Convertir cotización a remisión — crea solo un documento en la colección 'remisions'
exports.remisionarCotizacion = async (req, res) => {
  try {
    const { cotizacionId, fechaEntrega, observaciones } = req.body;

    const cotizacion = await Cotizacion.findById(cotizacionId).populate('cliente.referencia');
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const numeroRemision = await generarNumeroRemision();
    const productosRemisionDoc = mapearProductosRemision(cotizacion.productos);
    const total = productosRemisionDoc.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const cantidadTotal = productosRemisionDoc.reduce((s, p) => s + (Number(p.cantidad) || 0), 0);

    const clienteId = await resolverClienteId(cotizacion);
    if (!clienteId) {
      return res.status(400).json({ message: 'No se pudo resolver el cliente para crear la remisión' });
    }

    // Asegurar que el cliente esté marcado como cliente real
    try {
      await Cliente.updateOne({ _id: clienteId, esCliente: false }, { $set: { esCliente: true } });
    } catch (e) {
      console.warn('No se pudo actualizar esCliente a true para el cliente:', e?.message || e);
    }

    // Antes de crear la remisión, intentar descontar el stock de los productos mencionados.
    // Preferimos usar transacciones si la deployment lo permite; si no (por ejemplo, servidor mongod standalone),
    // hacemos un flujo de comprobación-antes-decremento sin sesión como fallback.
    let usedTransaction = false;
    try {
      let session = null;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        usedTransaction = true;

        for (const prod of cotizacion.productos || []) {
          const prodId = prod.producto?.id || prod.producto;
          if (!prodId) continue;
          const productoDoc = await Product.findById(prodId).session(session);
          if (!productoDoc) continue; // omitimos si no existe el producto
          const cantidadReq = Number(prod.cantidad || 0);
          if (productoDoc.stock < cantidadReq) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Stock insuficiente para ${productoDoc.name}. Stock actual: ${productoDoc.stock}, requerido: ${cantidadReq}` });
          }
          productoDoc.stock = productoDoc.stock - cantidadReq;
          await productoDoc.save({ session });
          console.log(`📦 Stock descontado (cotización->remisión): ${productoDoc.name} - nuevo stock: ${productoDoc.stock}`);
        }

        await session.commitTransaction();
        session.endSession();
      } catch (txErr) {
        // Si el error indica que las transacciones no están soportadas, haremos fallback.
        if (session) {
          try { await session.abortTransaction(); } catch (e) { /* ignore */ }
          try { session.endSession(); } catch (e) { /* ignore */ }
        }
        // Re-throw para ser capturado por el outer catch y ejecutar fallback
        throw txErr;
      }
    } catch (errStart) {
      // Si el error es por "Transaction numbers are only allowed..." u otro que impida usar transacciones,
      // hacemos un flujo no-transaccional: primero verificamos que todo el stock sea suficiente, y si es así,
      // decrementamos secuencialmente.
      console.warn('Transacciones no disponibles o fallo al iniciar session, usando fallback no-transaccional para decrementar stock:', errStart?.message || errStart);

      // 1) Verificar disponibilidad de stock para todos los productos
      for (const prod of cotizacion.productos || []) {
        const prodId = prod.producto?.id || prod.producto;
        if (!prodId) continue;
        const productoDoc = await Product.findById(prodId);
        if (!productoDoc) continue;
        const cantidadReq = Number(prod.cantidad || 0);
        if (productoDoc.stock < cantidadReq) {
          return res.status(400).json({ message: `Stock insuficiente para ${productoDoc.name}. Stock actual: ${productoDoc.stock}, requerido: ${cantidadReq}` });
        }
      }

      // 2) Decrementar secuencialmente (no transaccional)
      try {
        for (const prod of cotizacion.productos || []) {
          const prodId = prod.producto?.id || prod.producto;
          if (!prodId) continue;
          const productoDoc = await Product.findById(prodId);
          if (!productoDoc) continue;
          const cantidadReq = Number(prod.cantidad || 0);
          productoDoc.stock = productoDoc.stock - cantidadReq;
          await productoDoc.save();
          console.log(`📦 Stock descontado (cotización->remisión fallback): ${productoDoc.name} - nuevo stock: ${productoDoc.stock}`);
        }
      } catch (errFallback) {
        console.error('Error actualizando stock en fallback no-transaccional:', errFallback);
        return res.status(500).json({ message: 'Error al actualizar stock (fallback)', error: errFallback.message });
      }
    }

    const Remision = require('../models/Remision');
    // Construir observaciones y, si existe, actualizar el pedido relacionado
    let observacionesTexto = `Remisión generada desde cotización ${cotizacion.codigo}. ${observaciones || ''}`;

    const Pedido = require('../models/Pedido');
    const pedidoRef = cotizacion.pedidoReferencia || cotizacion.pedidoreferencia || cotizacion.pedidoreferencia || null;
    if (pedidoRef) {
      try {
        const pedidoDoc = await Pedido.findById(pedidoRef).lean();
        if (pedidoDoc) {
          // Actualizar estado del pedido a 'entregado'
          await Pedido.findByIdAndUpdate(pedidoDoc._id, { estado: 'entregado' });
          const pedidoIdent = pedidoDoc.numeroPedido || String(pedidoDoc._id);
          observacionesTexto += ` y pedido  ${pedidoIdent}.`;
        }
      } catch (err) {
        console.warn('No se pudo actualizar el pedido relacionado:', err?.message || err);
      }
    }

    if (!clienteId) {
      return res.status(400).json({ message: 'No se pudo resolver el cliente para crear la remisión' });
    }

    // Asegurar que el cliente esté marcado como cliente real (esCliente: true)
    try {
      await Cliente.updateOne({ _id: clienteId, esCliente: false }, { $set: { esCliente: true } });
    } catch (e) {
      console.warn('No se pudo actualizar esCliente a true para el cliente:', e?.message || e);
    }

    const nuevaRemision = new Remision({
      numeroRemision,
      cotizacionReferencia: cotizacion._id,
      cotizacionCodigo: cotizacion.codigo,
      cliente: clienteId,
      productos: productosRemisionDoc,
      fechaRemision: new Date(),
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : new Date(),
      observaciones: observacionesTexto,
      responsable: req.userId || null,
      estado: 'activa',
      total,
      cantidadItems: productosRemisionDoc.length,
      cantidadTotal
    });

    await nuevaRemision.save();

    // Al crear una remisión, la operación del cliente pasa a 'compra'
    try {
      await Cliente.findByIdAndUpdate(clienteId, { operacion: 'compra' });
    } catch (error_) {
      console.warn('No se pudo actualizar operacion a compra tras remisión:', error_?.message || error_);
    }

    await Cotizacion.findByIdAndUpdate(cotizacionId, {
      estado: 'Remisionada',
      remisionReferencia: nuevaRemision._id,
      codigoRemision: numeroRemision
    });

    const remisionCompleta = await Remision.findById(nuevaRemision._id)
      .populate('responsable', 'username firstName surname');

    return res.status(201).json({
      message: 'Remisión creada exitosamente',
      remision: remisionCompleta,
      numeroRemision,
      cotizacionReferencia: cotizacion.codigo
    });
  } catch (error) {
    console.error('Error remisionando cotización:', error);
    return res.status(500).json({ message: 'Error al remisionar cotización', error: error.message });
  }
};