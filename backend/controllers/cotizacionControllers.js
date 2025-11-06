const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Products');
const Product = require('../models/Products'); // Ensure both references work
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const PDFService = require('../services/pdfService');

const { validationResult } = require('express-validator');

// Configurar SendGrid de forma segura para no bloquear el arranque
try {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey && apiKey.startsWith('SG.')) {
    sgMail.setApiKey(apiKey);
    console.log('✉️  SendGrid listo (cotizaciones)');
  } else {
    console.log('✉️  SendGrid no configurado (cotizaciones): se omitirá hasta el envío');
  }
} catch (e) {
  console.warn('⚠️  No se pudo inicializar SendGrid (cotizaciones). Continuando sin correo:', e.message);
}

// Configurar Gmail transporter
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'PENDIENTE_GENERAR') {
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Crear cotización
exports.createCotizacion = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errors: errores.array() });
  }

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

    // Validar que responsable.id sea un ObjectId válido
    if (!responsable || !responsable.id || !responsable.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'El responsable debe ser el id del usuario registrado.' });
    }

    
    if (!cliente || !cliente.correo) {
      return res.status(400).json({ message: 'Datos de cliente inválidos' });
    }

    // Buscar cliente existente por correo
    let clienteExistente = await Cliente.findOne({ correo: cliente.correo });

    if (!clienteExistente) {
      // Crear cliente potencial
      clienteExistente = new Cliente({
        nombre: cliente.nombre,
        ciudad: cliente.ciudad,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        correo: cliente.correo,
        esCliente: !clientePotencial // true si es cliente, false si prospecto
      });
      await clienteExistente.save();
    } else {
      // Si ya existe, asegúrate de que se marque como cliente
      if (!clienteExistente.esCliente && !clientePotencial) {
        clienteExistente.esCliente = true;
        await clienteExistente.save();
      }
    }

    let fechaCotizacion = null;

    if (fecha && !isNaN(new Date(fecha).getTime())) {
      fechaCotizacion = new Date(fecha);
    } else {
      fechaCotizacion = new Date(); // si no viene, usa la fecha actual
    }



    // Generar código aleatorio COT-XXXX (letras y números)
    function generarCodigoCotizacion() {
      const chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
      let codigo = '';
      for (let i = 0; i < 4; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `COT-${codigo}`;
    }

    // Mapear productos con nombre
    const productosConNombre = await Promise.all(
      productos.map(async (prod) => {
        let productoInfo = null;
        if (prod.producto && prod.producto.id) {
          productoInfo = await Producto.findById(prod.producto.id).lean();
        }
        return {
          producto: {
            id: prod.producto.id,
            name: productoInfo ? productoInfo.name : prod.producto.name
          },
          descripcion: prod.descripcion,
          cantidad: prod.cantidad,
          valorUnitario: prod.valorUnitario,
          descuento: prod.descuento,
          subtotal: prod.subtotal
        };
      })
    );

    // Crear cotización con todos los datos embebidos y referencias
    // IMPORTANT: embed exactly the data provided in the request inputs (no automatic fetch-overwrite)
    const cotizacion = new Cotizacion({
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
      descripcion,
      condicionesPago,
      productos: productosConNombre,
      empresa: req.body.empresa || undefined,
      clientePotencial,
      enviadoCorreo
    });

    await cotizacion.save();

    // Obtener datos completos del cliente
    const cotizacionConCliente = await Cotizacion.findById(cotizacion._id)
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente');

    res.status(201).json({ message: 'Cotización creada', data: cotizacionConCliente });

  } catch (error) {
    console.error('❌ Error al crear cotización:', error);
    res.status(500).json({ message: 'Error al crear cotización', error: error.message });
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

    // Process each cotization to ensure product data is properly structured
    const processedCotizaciones = cotizaciones.map(cotizacion => {
      const cotObj = cotizacion.toObject();
      if (Array.isArray(cotObj.productos)) {
        cotObj.productos = cotObj.productos.map(p => {
          if (p.producto && p.producto.id) {
            // Handle both populated and non-populated product data
            if (typeof p.producto.id === 'object' && p.producto.id.name) {
              // Populated data
              p.producto.name = p.producto.id.name || p.producto.name;
              p.producto.price = p.producto.id.price || p.producto.price;
              p.producto.description = p.producto.id.description || p.producto.description;
            }
            // If not populated or missing, keep original name
          }
          return p;
        });
      }
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
    // Validate ObjectId format first
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de cotización inválido' });
    }

    let cotizacion = await Cotizacion.findById(req.params.id)
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
      .populate({
        path: 'productos.producto.id',
        model: 'Product',
        select: 'name price description'
      });

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Flatten populated product data for easier frontend consumption
    const cotObj = cotizacion.toObject();
    if (Array.isArray(cotObj.productos)) {
      cotObj.productos = cotObj.productos.map(p => {
        if (p.producto && p.producto.id) {
          p.producto.name = p.producto.id.name || p.producto.name;
          p.producto.price = p.producto.id.price || p.producto.price;
          p.producto.description = p.producto.id.description || p.producto.description;
        }
        return p;
      });
    }

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
    // No permitir cambiar el código ni el _id
    const { codigo, _id, ...rest } = req.body;

    // Si se actualiza cliente, actualizar también en la colección Cliente
    if (rest.cliente && rest.cliente.referencia) {
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

    const cotizacion = await Cotizacion.findByIdAndUpdate(
      req.params.id,
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
    // Primero obtenemos la cotización para comprobar su antigüedad
    const cotizacion = await Cotizacion.findById(req.params.id);
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
    await Cotizacion.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Cotización eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cotización', error: error.message });
  }
};

// Cambiar estado de cotización
exports.updateEstadoCotizacion = async (req, res) => {
  const { estado } = req.body;
  try {
    const cotizacion = await Cotizacion.findByIdAndUpdate(
      req.params.id,
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
    // Validate ObjectId format first
    if (!cliente || !cliente.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    let cotizacion = await Cotizacion.findOne({ 'cliente.referencia': cliente })
      .sort({ createdAt: -1 })
      .populate({
        path: 'productos.producto.id',
        model: 'Product',
        select: 'name price description'
      })
      .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente');

    if (!cotizacion) return res.status(404).json({ message: 'No hay cotización' });

    const cotObj = cotizacion.toObject();
    if (Array.isArray(cotObj.productos)) {
      cotObj.productos = cotObj.productos.map(p => {
        if (p.producto && p.producto.id) {
          p.producto.name = p.producto.id.name || p.producto.name;
          p.producto.price = p.producto.id.price || p.producto.price;
          p.producto.description = p.producto.id.description || p.producto.description;
        }
        return p;
      });
    }

    res.json({ data: cotObj });
  } catch (error) {
    console.error('[ERROR getUltimaCotizacionPorCliente]', error);
    res.status(500).json({ message: 'Error al obtener la cotización' });
  }
};

// Enviar cotización por correo
exports.enviarCotizacionPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body;
    const cotizacionId = req.params.id;

    console.log('🔍 Iniciando envío de correo para cotización:', cotizacionId);
    console.log('📧 Datos de envío:', { correoDestino, asunto });

    const cotizacion = await Cotizacion.findById(cotizacionId)
      .populate('cliente.referencia', 'nombre correo ciudad telefono')
      .populate({
        path: 'productos.producto.id',
        model: 'Product',
        select: 'name price description'
      });

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const destinatario = correoDestino || cotizacion.cliente.correo;
    const asuntoFinal = asunto || `Cotización ${cotizacion.codigo} - JLA Global Company`;
    const mensajeFinal = mensaje || `Nos complace enviarle la cotización ${cotizacion.codigo}. Esperamos que sea de su interés y quedamos atentos a sus comentarios.`;

    // Generar HTML de la cotización
    const cotizacionHTML = generarHTMLCotizacion(cotizacion);
    
    // Generar PDF de la cotización
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la cotización...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFCotizacion(cotizacion);
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
    
    // Debug: Verificar datos de la cotización
    console.log('📊 Datos de cotización para HTML:');
    console.log('   - Total:', cotizacion.total);
    console.log('   - Productos:', cotizacion.productos?.length || 0);
    console.log('   - Productos detalle:', cotizacion.productos?.map(p => ({
      producto: p.producto?.name || 'N/A',
      cantidad: p.cantidad,
      valorUnitario: p.valorUnitario,
      subtotal: p.subtotal
    })));
    
    // El HTML ya incluye todo el contenido estructurado
    const htmlCompleto = cotizacionHTML;

    // Verificar configuraciones disponibles
    const useGmail = process.env.USE_GMAIL === 'true';
    const gmailTransporter = createGmailTransporter();
    const sendgridConfigured = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.');

    console.log('⚙️ Configuraciones disponibles:');
    console.log(`   Gmail configurado: ${gmailTransporter ? 'SÍ' : 'NO'}`);
    console.log(`   SendGrid configurado: ${sendgridConfigured ? 'SÍ' : 'NO'}`);
    console.log(`   Usar Gmail prioritario: ${useGmail}`);

    // Intentar envío con Gmail si está configurado y habilitado
    if (useGmail && gmailTransporter) {
      try {
        console.log('� Enviando con Gmail...');
        
        const mailOptions = {
          from: `"JLA Global Company" <${process.env.GMAIL_USER}>`,
          to: destinatario,
          subject: asuntoFinal,
          html: htmlCompleto,
          attachments: pdfAttachment ? [{
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
            contentType: pdfAttachment.contentType
          }] : []
        };

        await gmailTransporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente con Gmail');
        
        // Marcar como enviado por correo
        await Cotizacion.findByIdAndUpdate(cotizacionId, { enviadoCorreo: true });

        return res.status(200).json({ 
          message: '¡Cotización enviada por correo exitosamente!',
          details: {
            destinatario: destinatario,
            asunto: asuntoFinal,
            enviado: true,
            metodo: 'Gmail SMTP',
            fecha: new Date().toLocaleString('es-CO')
          }
        });

      } catch (gmailError) {
        console.error('❌ Error con Gmail:', gmailError.message);
        console.log('🔄 Intentando con SendGrid como fallback...');
      }
    }

    // Intentar con SendGrid si Gmail falló o no está configurado
    if (sendgridConfigured) {
      try {
        console.log('� Enviando con SendGrid...');

        const msg = {
          to: destinatario,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME
          },
          subject: asuntoFinal,
          text: mensajeFinal,
          html: htmlCompleto,
          attachments: pdfAttachment ? [{
            content: pdfAttachment.content.toString('base64'),
            filename: pdfAttachment.filename,
            type: pdfAttachment.contentType,
            disposition: 'attachment'
          }] : []
        };

        await sgMail.send(msg);
        
        console.log('✅ Correo enviado exitosamente con SendGrid');
        
        // Marcar como enviado por correo
        await Cotizacion.findByIdAndUpdate(cotizacionId, { enviadoCorreo: true });

        return res.status(200).json({ 
          message: '¡Cotización enviada por correo exitosamente!',
          details: {
            destinatario: destinatario,
            asunto: asuntoFinal,
            enviado: true,
            metodo: 'SendGrid',
            fecha: new Date().toLocaleString('es-CO')
          }
        });

      } catch (sendError) {
        console.error('❌ Error con SendGrid:', sendError.message);
        
        if (sendError.code === 401) {
          console.error('🔑 Error 401: API Key inválida o sin permisos');
        } else if (sendError.code === 403) {
          console.error('🚫 Error 403: Email remitente no verificado');
        }
      }
    }

    // Si ambos fallan, usar simulación
    console.log('📧 SIMULACIÓN DE ENVÍO (ambos servicios fallaron):');
    console.log(`   Destinatario: ${destinatario}`);
    console.log(`   Asunto: ${asuntoFinal}`);
    
    // Marcar como enviado por correo (simulación)
    await Cotizacion.findByIdAndUpdate(cotizacionId, { enviadoCorreo: true });

    return res.status(200).json({ 
      message: 'Envío simulado (servicios de correo no disponibles)',
      details: {
        destinatario: destinatario,
        asunto: asuntoFinal,
        simulado: true,
        nota: 'Configure Gmail o SendGrid correctamente para envío real'
      }
    });

  } catch (error) {
    console.error('💥 Error general:', error);
    res.status(500).json({ 
      message: 'Error interno al procesar el envío', 
      error: error.message
    });
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
            <p>Estimado/a ${cotizacion.cliente?.nombre || 'Cliente'}, esperamos que se encuentre muy bien. Adjunto encontrará la cotización solicitada con todos los detalles de los productos y servicios requeridos. Esta cotización tiene una validez de ${cotizacion.validez || '15 días'} a partir de la fecha de emisión. Quedamos atentos a sus comentarios y esperamos tener la oportunidad de trabajar juntos.</p>
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

// Convertir cotización a pedido (remisionar)
exports.remisionarCotizacion = async (req, res) => {
  try {
    const { cotizacionId, fechaEntrega, observaciones } = req.body;

    const cotizacion = await Cotizacion.findById(cotizacionId)
      .populate('cliente.referencia');

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Función para generar número de pedido secuencial usando Counter
    const generarNumeroPedido = async () => {
      const Counter = require('../models/Counter');
      const counter = await Counter.findByIdAndUpdate(
        'pedido',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return `PED-${String(counter.seq).padStart(5, '0')}`;
    };

    // Función para generar número de remisión secuencial
    const generarNumeroRemision = async () => {
      const Counter = require('../models/Counter');
      const counter = await Counter.findByIdAndUpdate(
        'remision',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return `REM-${String(counter.seq).padStart(5, '0')}`;
    };

    // Generar números secuenciales
    const numeroPedido = await generarNumeroPedido();
    const numeroRemision = await generarNumeroRemision();

    // Mapear productos de cotización a pedido
    const productosRemision = cotizacion.productos.map(prodCotizacion => ({
      product: prodCotizacion.producto.id, // Mapear producto.id de cotización a product en pedido
      cantidad: prodCotizacion.cantidad,
      precioUnitario: prodCotizacion.valorUnitario || prodCotizacion.precioUnitario || 0
    }));

    // Crear el pedido/remisión
    const Pedido = require('../models/Pedido');
    
    const nuevoPedido = new Pedido({
      numeroPedido: numeroPedido,
      cliente: cotizacion.cliente.referencia._id, // Referenciar al cliente
      productos: productosRemision,
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : new Date(),
      estado: 'entregado', // Estado entregado al crear desde cotización (remisión directa)
      observacion: observaciones || '',
      cotizacionReferenciada: cotizacionId,
      cotizacionCodigo: cotizacion.codigo
    });

    await nuevoPedido.save();

    // Crear la remisión automáticamente
    const Remision = require('../models/Remision');
    
    // Calcular totales para la remisión
    const total = cotizacion.productos.reduce((sum, prod) => {
      return sum + (prod.cantidad * (prod.valorUnitario || prod.precioUnitario || 0));
    }, 0);
    
    const cantidadTotal = cotizacion.productos.reduce((sum, prod) => {
      return sum + prod.cantidad;
    }, 0);

    // Mapear productos para la remisión
    const productosRemisionDoc = cotizacion.productos.map(prod => ({
      nombre: prod.producto?.name || prod.nombre || 'Producto sin nombre',
      cantidad: prod.cantidad,
      precioUnitario: prod.valorUnitario || prod.precioUnitario || 0,
      total: prod.cantidad * (prod.valorUnitario || prod.precioUnitario || 0),
      descripcion: prod.descripcion || prod.producto?.description || '',
      codigo: prod.producto?.codigo || prod.codigo || ''
    }));

    const nuevaRemision = new Remision({
      numeroRemision: numeroRemision,
      pedidoReferencia: nuevoPedido._id,
      codigoPedido: numeroPedido,
      cotizacionReferencia: cotizacionId,
      codigoCotizacion: cotizacion.codigo,
      cliente: {
        nombre: cotizacion.cliente?.nombre || cotizacion.cliente.referencia?.nombre,
        correo: cotizacion.cliente?.correo || cotizacion.cliente.referencia?.correo,
        telefono: cotizacion.cliente?.telefono || cotizacion.cliente.referencia?.telefono,
        ciudad: cotizacion.cliente?.ciudad || cotizacion.cliente.referencia?.ciudad,
        direccion: cotizacion.cliente?.direccion || cotizacion.cliente.referencia?.direccion
      },
      productos: productosRemisionDoc,
      fechaRemision: new Date(),
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : new Date(),
      observaciones: `Remisión generada automáticamente desde cotización ${cotizacion.codigo}. ${observaciones || ''}`,
      responsable: req.userId, // ID del usuario que crea la remisión
      estado: 'activa',
      total: total,
      cantidadItems: productosRemisionDoc.length,
      cantidadTotal: cantidadTotal
    });

    await nuevaRemision.save();

    // Actualizar estado de la cotización
    await Cotizacion.findByIdAndUpdate(cotizacionId, { 
      estado: 'remisionado',
      pedidoReferencia: nuevoPedido._id 
    });

    // Poblar el pedido para la respuesta
    const pedidoCompleto = await Pedido.findById(nuevoPedido._id)
      .populate('cliente')
      .populate('productos.product');

    // Poblar la remisión para la respuesta
    const remisionCompleta = await Remision.findById(nuevaRemision._id)
      .populate('responsable', 'username firstName surname');

    res.status(201).json({ 
      message: 'Cotización remisionada exitosamente',
      pedido: pedidoCompleto,
      remision: remisionCompleta,
      numeroPedido: numeroPedido,
      numeroRemision: numeroRemision
    });
  } catch (error) {
    console.error('Error remisionando cotización:', error);
    res.status(500).json({ message: 'Error al remisionar cotización', error: error.message });
  }
};