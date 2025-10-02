const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Products');
const Product = require('../models/Products'); // Ensure both references work
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const { validationResult } = require('express-validator');

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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
    const asuntoFinal = asunto || `Cotización ${cotizacion.codigo} - Pangea Sistemas`;
    const mensajeFinal = mensaje || `Nos complace enviarle la cotización ${cotizacion.codigo}. Esperamos que sea de su interés y quedamos atentos a sus comentarios.`;

    // Generar HTML de la cotización
    const cotizacionHTML = generarHTMLCotizacion(cotizacion);
    
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
          from: `"Pangea Sistemas" <${process.env.GMAIL_USER}>`,
          to: destinatario,
          subject: asuntoFinal,
          html: htmlCompleto
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
          html: htmlCompleto
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

  const productosHTML = cotizacion.productos.map((p, index) => `
    <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
      <td data-label="Producto:" style="padding: 15px; border-bottom: 1px solid #eee;">
        <strong>${p.producto?.name || 'Producto'}</strong>
        ${p.descripcion ? `<br><small style="color: #666;">${p.descripcion}</small>` : ''}
      </td>
      <td data-label="Cantidad:" style="padding: 15px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">${p.cantidad || 0}</td>
      <td data-label="Precio Unit.:" style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">$${(p.valorUnitario || 0).toLocaleString('es-ES')}</td>
      <td data-label="Descuento:" style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">${p.descuento || 0}%</td>
      <td data-label="Subtotal:" style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${(p.subtotal || 0).toLocaleString('es-ES')}</td>
    </tr>
  `).join('');

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
          background: linear-gradient(135deg, #667eea, #764ba2); 
          color: white; 
          padding: 20px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        .header:before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="80" r="2.5" fill="rgba(255,255,255,0.1)"/></svg>');
          animation: float 20s infinite linear;
          pointer-events: none;
        }
        @keyframes float {
          0% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
          100% { transform: translateX(0%) translateY(0%) rotate(360deg); }
        }
        .header h1 { 
          font-size: 2em; 
          margin-bottom: 10px; 
          font-weight: 300; 
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p { 
          font-size: 1em; 
          opacity: 0.9; 
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 20px; 
        }
        .info-grid { 
          display: block;
          margin-bottom: 20px; 
        }
        .info-card { 
          background: linear-gradient(135deg, #f8fafc, #e2e8f0); 
          padding: 15px; 
          border-radius: 12px; 
          border-left: 4px solid #667eea; 
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }
        .info-card h3 { 
          color: #667eea; 
          margin-bottom: 10px; 
          font-size: 1.1em; 
          text-align: center;
          border-bottom: 2px dotted #cbd5e1;
          padding-bottom: 8px;
        }
        .info-card p { 
          margin-bottom: 8px; 
          color: #555; 
          font-size: 0.9em;
          padding: 3px 0;
          border-bottom: 1px dotted #e5e7eb;
        }
        .info-card p:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .info-card strong { 
          color: #333; 
        }
        .products-section { 
          margin: 20px 0; 
        }
        .products-title { 
          background: #667eea; 
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
          border: 1px solid #e0e7ff; 
          margin-bottom: 15px; 
          border-radius: 12px; 
          background: linear-gradient(135deg, #ffffff, #f8fafc); 
          padding: 15px; 
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
          border-left: 4px solid #667eea;
        }
        
        .products-table td { 
          display: block; 
          text-align: left !important; 
          padding: 8px 0; 
          border: none; 
          position: relative; 
          padding-left: 130px; 
          font-size: 0.95em;
        }
        
        .products-table td:before { 
          content: attr(data-label); 
          position: absolute; 
          left: 0; 
          width: 120px; 
          font-weight: bold; 
          color: #667eea; 
          font-size: 0.9em; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .products-table td:first-child {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 8px;
          padding-bottom: 12px;
        }
        
        .products-table td:first-child strong {
          color: #1f2937;
          font-size: 1.05em;
        }
        
        .products-table td:last-child {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          margin: 10px -15px -15px -15px;
          padding: 12px 15px 12px 130px;
          border-radius: 0 0 8px 8px;
          font-weight: bold;
          font-size: 1.1em;
        }
        
        .products-table td:last-child:before {
          color: #e0e7ff;
        }
        
        .total-row { 
          background: #e3f2fd !important; 
          font-weight: bold; 
          border: 2px solid #667eea !important; 
        }
        
        .total-row td { 
          color: #667eea; 
          font-size: 1.1em; 
        }
        
        .total-row td:before { 
          color: #667eea; 
        }
        
        /* Mobile total summary */
        .mobile-total {
          display: block;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: center;
          font-size: 1.3em;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          border: 3px solid #e0e7ff;
        }
        
        .mobile-summary {
          display: block;
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border: 2px solid #667eea;
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .mobile-summary h4 {
          color: #667eea;
          font-size: 1.1em;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .mobile-summary p {
          margin: 5px 0;
          font-size: 0.95em;
          padding: 3px 0;
          border-bottom: 1px dotted #cbd5e1;
        }
        
        .mobile-summary p:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 1.05em;
          color: #667eea;
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
          background: #667eea; 
          color: white; 
        }
        
        /* Desktop styles */
        @media (min-width: 768px) { 
          body { 
            padding: 20px; 
          }
          .header { 
            padding: 30px; 
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
            margin-bottom: 0;
          }
          .info-card h3 { 
            font-size: 1.2em; 
          }
          .info-card p { 
            font-size: 1em; 
          }
          .products-section { 
            margin: 30px 0; 
          }
          .products-title { 
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
            background: #764ba2; 
            color: white; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { 
            background: #f8f9fa; 
          }
          .total-row td { 
            border-top: 3px solid #667eea; 
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
          
          .mobile-summary {
            display: none;
          }
        } 
          margin-bottom: 15px; 
          font-size: 1.2em; 
        }
        .info-card p { 
          margin-bottom: 8px; 
          color: #555; 
        }
        .info-card strong { 
          color: #333; 
        }
        .products-section { 
          margin: 30px 0; 
        }
        .products-title { 
          background: #667eea; 
          color: white; 
          padding: 15px; 
          margin-bottom: 0; 
          border-radius: 8px 8px 0 0; 
          font-size: 1.3em; 
        }
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
          border-radius: 0 0 8px 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .products-table th { 
          background: #5a67d8; 
          color: white; 
          padding: 15px; 
          text-align: left; 
          font-weight: 600; 
        }
        .products-table td { 
          padding: 15px; 
          border-bottom: 1px solid #eee; 
        }
        .products-table tr:hover { 
          background: #f1f5f9; 
        }
        .total-row { 
          background: #e3f2fd !important; 
          font-weight: bold; 
          font-size: 1.1em; 
        }
        .total-row td { 
          color: #667eea; 
          border-top: 3px solid #667eea; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 5px 12px; 
          border-radius: 20px; 
          font-size: 0.9em; 
          font-weight: bold; 
          text-transform: uppercase; 
          background: #4ade80; 
          color: white; 
        }
        @media (max-width: 600px) { 
          .info-grid { 
            grid-template-columns: 1fr; 
            gap: 20px; 
          } 
          .container { 
            margin: 10px; 
          }
          .header h1 { 
            font-size: 2em; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>💼 COTIZACIÓN</h1>
          <p>Propuesta comercial No. <strong>${cotizacion.codigo}</strong></p>
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

            <!-- Cotización -->
            <div class="info-card">
              <h3>📋 Detalles de la Cotización</h3>
              <p><strong>Fecha:</strong> ${new Date(cotizacion.fecha).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Estado:</strong> ${cotizacion.estado || 'Pendiente'}</p>
              <p><strong>Validez:</strong> ${cotizacion.validez || '15 días'}</p>
              <p><strong>Items:</strong> ${cotizacion.productos?.length || 0} productos</p>
              <p><strong>Total:</strong> $${totalSeguro.toLocaleString('es-ES')}</p>
            </div>
          </div>

          <!-- Mobile Summary -->
          <div class="mobile-summary">
            <h4>📊 Resumen de la Cotización</h4>
            <p><strong>Cliente:</strong> ${cotizacion.cliente?.nombre || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(cotizacion.fecha).toLocaleDateString('es-ES')}</p>
            <p><strong>Validez:</strong> ${cotizacion.validez || '15 días'}</p>
            <p><strong>Productos:</strong> ${cotizacion.productos?.length || 0} items</p>
            <p><strong>Total General:</strong> $${totalSeguro.toLocaleString('es-ES')}</p>
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
                  <th style="text-align: center;">Descuento</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productosHTML}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="TOTAL:" colspan="4" style="text-align: right; font-size: 1.2em;">💰 <strong>TOTAL GENERAL:</strong></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>$${totalSeguro.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Mobile Total Summary -->
            <div class="mobile-total">
              💰 Total General: $${totalSeguro.toLocaleString('es-ES')}
            </div>
          </div>

          ${cotizacion.descripcion ? `
          <!-- Descripción -->
          <div class="info-card" style="margin-top: 20px;">
            <h3>📝 Descripción</h3>
            <p>${cotizacion.descripcion}</p>
          </div>
          ` : ''}

          ${cotizacion.condicionesPago ? `
          <!-- Condiciones -->
          <div class="info-card" style="margin-top: 20px; border-left-color: #f59e0b;">
            <h3 style="color: #f59e0b;">💳 Condiciones de Pago</h3>
            <p>${cotizacion.condicionesPago}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #343a40; color: #adb5bd; padding: 25px; text-align: center;">
          <p><strong>${process.env.COMPANY_NAME || 'Pangea Sistemas'}</strong></p>
          <p>📧 ${process.env.GMAIL_USER || process.env.SENDGRID_FROM_EMAIL || 'contacto@empresa.com'} | 📞 ${process.env.COMPANY_PHONE || 'Tel: (555) 123-4567'}</p>
          <p style="margin-top: 15px; font-size: 0.9em;">
            Esta cotización fue generada automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
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

    // Crear el pedido/remisión
    const Pedido = require('../models/Pedido');
    
    const nuevoPedido = new Pedido({
      numeroPedido: `PED-${Date.now()}`,
      cliente: cotizacion.cliente,
      productos: cotizacion.productos,
      fechaEntrega: fechaEntrega || new Date(),
      estado: 'pendiente',
      descripcion: cotizacion.descripcion,
      condicionesPago: cotizacion.condicionesPago,
      observaciones: observaciones || '',
      cotizacionReferencia: cotizacionId,
      responsable: cotizacion.responsable
    });

    await nuevoPedido.save();

    // Actualizar estado de la cotización
    await Cotizacion.findByIdAndUpdate(cotizacionId, { 
      estado: 'remisionado',
      pedidoReferencia: nuevoPedido._id 
    });

    res.status(201).json({ 
      message: 'Cotización remisionada exitosamente',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error remisionando cotización:', error);
    res.status(500).json({ message: 'Error al remisionar cotización', error: error.message });
  }
};