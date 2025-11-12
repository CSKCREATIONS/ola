const Compra = require('../models/compras');
const nodemailer = require('nodemailer');
const PDFService = require('../services/pdfService');

// Configurar Gmail transporter (igual que en cotizaciones)
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'PENDIENTE_GENERAR') {
    console.warn('⚠️  Gmail no configurado correctamente');
    return null;
  }
  
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  } catch (error) {
    console.error('❌ Error creando transporter:', error);
    return null;
  }
};

// Crear una nueva compra (solo desde Orden de Compra)
// Crear nueva compra
const crearCompra = async (req, res) => {
  try {
    // Si viene marcada como creada desde orden, no la volvemos a guardar
    if (req.body._fromOrden) {
      return res.status(200).json({
        success: true,
        message: 'Compra creada desde Orden de Compra (no duplicada)'
      });
    }

    // Sanitizar y validar datos antes de crear la compra
    // Whitelist approach: solo campos permitidos para prevenir inyección NoSQL
    const allowedFields = {
      numeroOrden: String(req.body.numeroOrden || '').trim(),
      proveedor: String(req.body.proveedor || '').trim(),
      solicitadoPor: String(req.body.solicitadoPor || '').trim(),
      observaciones: String(req.body.observaciones || '').trim(),
      estado: String(req.body.estado || 'Completada').trim()
    };
    
    // Validar y sanitizar productos (evita inyección de campos no deseados)
    const productos = Array.isArray(req.body.productos) 
      ? req.body.productos.map(p => ({
          producto: String(p.producto || '').trim(),
          descripcion: String(p.descripcion || '').trim(),
          cantidad: Number(p.cantidad) || 0,
          valorUnitario: Number(p.valorUnitario) || 0,
          descuento: Number(p.descuento) || 0,
          valorTotal: Number(p.valorTotal) || 0
        }))
      : [];
    
    // Validar números de forma segura (previene NaN y valores maliciosos)
    const subtotal = Number(req.body.subtotal) || 0;
    const impuestos = Number(req.body.impuestos) || 0;
    const total = Number(req.body.total) || 0;
    
    // Validar fecha de forma segura
    let fecha = new Date();
    if (req.body.fecha) {
      const parsedDate = new Date(req.body.fecha);
      if (!Number.isNaN(parsedDate.getTime())) {
        fecha = parsedDate;
      }
    }

    // Validaciones básicas
    if (!allowedFields.proveedor || productos.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos incompletos: se requiere proveedor y al menos un producto' 
      });
    }

    // Construir objeto final con campos explícitos (previene prototype pollution)
    const compraData = {
      numeroOrden: allowedFields.numeroOrden,
      proveedor: allowedFields.proveedor,
      solicitadoPor: allowedFields.solicitadoPor,
      productos: productos,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      observaciones: allowedFields.observaciones,
      estado: allowedFields.estado,
      fecha: fecha
    };

    // Usar new + save para mayor control (delegando validación a Mongoose schema)
    const nuevaCompra = new Compra(compraData);
    await nuevaCompra.save();
    res.status(201).json({ success: true, data: nuevaCompra });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};




// Obtener historial de compras por proveedor
const obtenerComprasPorProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Sanitizar el ID para prevenir inyección NoSQL
    const proveedorId = typeof id === 'string' ? id.trim() : '';
    
    if (!proveedorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de proveedor inválido' 
      });
    }

    const compras = await Compra.find({ proveedor: proveedorId })
      .populate('proveedor', 'name')
      .populate('productos.producto', 'nombre precio');

    res.status(200).json({ success: true, data: compras });
  } catch (error) {
    console.error('Error al obtener compras por proveedor:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Obtener todas las compras
const obtenerTodasLasCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate('proveedor', 'nombre')
      .populate('productos.producto', 'name price') // ✅ campos correctos
      .sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      data: compras
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras'
    });
  }
};

const eliminarCompra = async (req, res) => {
  try {
    // Sanitizar el ID para prevenir inyección NoSQL
    const compraId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    
    if (!compraId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de compra inválido' 
      });
    }

    const compra = await Compra.findByIdAndDelete(compraId);
    if (!compra) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    res.json({ success: true, message: 'Compra eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar la compra', error });
  }
};

// Controlador para actualizar una compra
const actualizarCompra = async (req, res) => {
  try {
    const { proveedor, productos, condicionesPago, observaciones, total } = req.body;
    const { id } = req.params;

    // Sanitizar el ID para prevenir inyección NoSQL
    const compraId = typeof id === 'string' ? id.trim() : '';
    
    if (!compraId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de compra inválido' 
      });
    }

    const compraActualizada = await Compra.findByIdAndUpdate(
      compraId,
      {
        proveedor,
        productos,
        condicionesPago,
        observaciones,
        total,
        fechaCompra: Date.now()
      },
      { new: true }
    );

    if (!compraActualizada) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }

    res.json({ success: true, data: compraActualizada });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar la compra', error });
  }
};

// Enviar compra por correo electrónico
const enviarCompraPorCorreo = async (req, res) => {
  try {
    const { id } = req.params;
    const { destinatario, asunto, mensaje } = req.body;

    const compraId = validateId(id);
    if (!compraId) return res.status(400).json({ success: false, message: 'ID de compra inválido' });

    console.log('🔍 Iniciando envío de correo para compra:', compraId);
    console.log('📧 Destinatario:', destinatario);

    if (!destinatario) return res.status(400).json({ success: false, message: 'Destinatario es requerido' });

    let compra = await Compra.findById(compraId).populate('proveedor', 'nombre email telefono');
    if (!compra) return res.status(404).json({ success: false, message: 'Compra no encontrada' });

    // Asegurar que cada producto tenga datos (best-effort)
    compra = await populateProductosIfNeeded(compra);

    // Crear transporter
    const transporter = createGmailTransporter();
    if (!transporter) return res.status(500).json({ success: false, message: 'Servicio de correo no configurado. Verifica las credenciales de Gmail en el archivo .env' });

    const compraHTML = generarHTMLCompra(compra, mensaje);
    const pdfAttachment = await generatePdfAttachmentSafe(compra);

    const asuntoFinal = asunto || `Compra Confirmada - N° ${compra.numeroOrden || 'N/A'} - JLA Global Company`;
    const mailOptions = {
      from: `"JLA Global Company" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asuntoFinal,
      html: compraHTML,
      attachments: pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : []
    };

    const result = await sendMailSafe(transporter, mailOptions);
    if (!result.ok) {
      return res.status(500).json({ success: false, message: 'Error al enviar correo', error: result.error?.message || 'Enviar fallo' });
    }

    console.log('✅ Correo enviado exitosamente' + (pdfAttachment ? ' con PDF adjunto' : ''));
    res.status(200).json({ success: true, message: '¡Compra enviada por correo exitosamente!' + (pdfAttachment ? ' con PDF adjunto' : ''), details: { destinatario, asunto: asuntoFinal, numeroOrden: compra.numeroOrden, pdfAdjunto: !!pdfAttachment, fecha: new Date().toLocaleString('es-CO') } });
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    res.status(500).json({ success: false, message: 'Error al enviar correo', error: error.message });
  }
};

// Función para generar HTML profesional (igual al módulo de ventas)
function generarHTMLCompra(compra, mensajePersonalizado = '') {
  const totalCalculado = compra.productos.reduce((total, producto) => {
    const subtotal = Number(producto.cantidad * producto.precioUnitario) || 0;
    return total + subtotal;
  }, 0);

  const totalFinal = Number(compra.total) || totalCalculado;
  const subtotalFinal = Number(compra.subtotal) || totalCalculado;
  const impuestosFinal = Number(compra.impuestos) || 0;

  // Generar filas de productos
  const productosHTML = compra.productos.map((p, index) => {
    const subtotal = p.cantidad * p.precioUnitario;
    return `
      <tr data-label="Producto ${index + 1}">
        <td data-label="Producto">${p.producto?.name || 'N/A'}</td>
        <td data-label="Cantidad">${p.cantidad}</td>
        <td data-label="Precio Unit.">$${Number(p.precioUnitario || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td data-label="Subtotal">$${Number(subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Compra ${compra.numeroOrden}</title>
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
          background: linear-gradient(135deg, #27ae60, #229954); 
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
        .info-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #27ae60; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #27ae60; 
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
          background: #27ae60; 
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
          color: #27ae60; 
          font-size: 0.9em; 
        }
        .total-section { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          margin-top: 20px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #dee2e6; 
        }
        .total-row.final { 
          border-bottom: none; 
          font-size: 1.3em; 
          font-weight: bold; 
          color: #27ae60; 
          margin-top: 10px; 
          padding-top: 10px; 
          border-top: 2px solid #27ae60; 
        }
        .observaciones {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .mensaje-personal {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          font-style: italic;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background: #f8f9fa; 
          color: #6c757d; 
          font-size: 0.9em; 
        }
        @media (min-width: 768px) {
          .products-table thead { 
            display: table-header-group; 
          }
          .products-table thead tr { 
            background: #27ae60; 
            color: white; 
            display: table-row; 
          }
          .products-table thead th { 
            padding: 12px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr { 
            display: table-row; 
            border: none; 
            margin-bottom: 0; 
          }
          .products-table td { 
            display: table-cell; 
            padding: 12px; 
            border-bottom: 1px solid #eee; 
            padding-left: 12px; 
          }
          .products-table td:before { 
            content: none; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Compra Confirmada</h1>
          <p>N° ${compra.numeroOrden || 'N/A'}</p>
        </div>
        
        <div class="content">
          ${mensajePersonalizado ? `
            <div class="mensaje-personal">
              <strong>📧 Mensaje:</strong> ${mensajePersonalizado}
            </div>
          ` : ''}

          <div class="info-card">
            <h3>📋 Información General</h3>
            <p><strong>Número de Orden:</strong> ${compra.numeroOrden || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(compra.fecha || compra.fechaCompra).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Estado:</strong> ${compra.estado || 'Confirmada'}</p>
          </div>

          <div class="info-card">
            <h3>🏢 Información del Proveedor</h3>
            <p><strong>Nombre:</strong> ${compra.proveedor?.nombre || 'No especificado'}</p>
            ${compra.proveedor?.email ? `<p><strong>Email:</strong> ${compra.proveedor.email}</p>` : ''}
            ${compra.proveedor?.telefono ? `<p><strong>Teléfono:</strong> ${compra.proveedor.telefono}</p>` : ''}
          </div>

          <div class="products-section">
            <h2 class="products-title">📦 Detalle de Productos</h2>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productosHTML}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span><strong>Subtotal:</strong></span>
              <span>$${subtotalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row">
              <span><strong>Impuestos (IVA):</strong></span>
              <span>$${impuestosFinal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL:</span>
              <span>$${totalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          ${compra.observaciones ? `
            <div class="observaciones">
              <strong>📝 Observaciones:</strong><br>
              ${compra.observaciones}
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p><strong>JLA Global Company</strong></p>
          <p>Este es un correo generado automáticamente. Por favor no responder.</p>
          <p>© ${new Date().getFullYear()} JLA Global Company. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}





module.exports = {
  crearCompra,
  obtenerComprasPorProveedor,
  obtenerTodasLasCompras,
  eliminarCompra,
  actualizarCompra,
  enviarCompraPorCorreo
};

// Helper: validate and return trimmed id or null
function validateId(raw) {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

// Helper: ensure productos entries have producto populated objects (best-effort)
async function populateProductosIfNeeded(compra) {
  if (!compra || !Array.isArray(compra.productos)) return compra;
  const Producto = require('../models/Products');
  for (let i = 0; i < compra.productos.length; i++) {
    const item = compra.productos[i];
    if (item.producto && typeof item.producto === 'string') {
      try {
        const producto = await Producto.findById(item.producto);
        if (producto) {
          compra.productos[i].producto = { _id: producto._id, name: producto.name, description: producto.description };
        }
      } catch (err) {
        console.warn('⚠️ No se pudo poblar el producto:', item.producto);
      }
    }
  }
  return compra;
}

// Helper: generate PDF attachment safely
async function generatePdfAttachmentSafe(compra) {
  try {
    console.log('📄 Generando PDF de la compra...');
    const pdfService = new PDFService();
    const pdfData = await pdfService.generarPDFCompra(compra);
    console.log('✅ PDF generado exitosamente:', pdfData.filename);
    return { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType };
  } catch (err) {
    console.error('⚠️ Error generando PDF:', err.message);
    return null;
  }
}

// Helper: send mail with transporter and options, returns {ok, error}
async function sendMailSafe(transporter, mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (err) {
    console.error('❌ Error al enviar correo:', err.message);
    return { ok: false, error: err };
  }
}