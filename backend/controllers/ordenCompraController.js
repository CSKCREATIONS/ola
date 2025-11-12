// controllers/ordenCompraController.js
const OrdenCompra = require('../models/ordenCompra');
const Compra = require('../models/compras'); // Asegúrate de que la ruta es correcta
const Producto = require('../models/Products'); // Importar modelo de productos
const nodemailer = require('nodemailer');
const PDFService = require('../services/pdfService');

// Configurar Gmail transporter (usar SMTPS explícito para garantizar TLS)
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'PENDIENTE_GENERAR') {
    console.warn('⚠️  Gmail no configurado correctamente');
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SMTPS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      requireTLS: true,
      tls: {
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000
    });
  } catch (error) {
    console.error('❌ Error creando transporter (SMTPS):', error);
    return null;
  }
};

// Helper: poblar productos dentro de la orden (si vienen como IDs)
async function populateOrdenProductos(orden) {
  if (!orden || !Array.isArray(orden.productos)) return;
  for (let i = 0; i < orden.productos.length; i++) {
    const item = orden.productos[i];
    try {
      if (item.producto && (typeof item.producto === 'string' || item.producto._bsontype === 'ObjectID')) {
        const productoDoc = await Producto.findById(item.producto).lean().exec();
        if (productoDoc) {
          orden.productos[i].producto = { _id: productoDoc._id, name: productoDoc.name, description: productoDoc.description };
        }
      }
    } catch (err) {
      console.warn('⚠️ No se pudo poblar el producto:', item.producto, err.message);
      // continue - non-fatal
    }
  }
}

// Helper: generar PDF de forma segura y devolver attachment o null
async function generatePdfAttachmentSafeOrden(orden) {
  try {
    const pdfService = new PDFService();
    const pdfData = await pdfService.generarPDFOrdenCompra(orden);
    return pdfData ? { filename: pdfData.filename, content: pdfData.buffer, contentType: pdfData.contentType } : null;
  } catch (e) {
    console.error('⚠️ Error generando PDF de orden (no crítico):', e.message);
    return null;
  }
}


// Crear nueva orden
const crearOrden = async (req, res) => {
  try {
    const nuevaOrden = new OrdenCompra(req.body);
    await nuevaOrden.save();
    res.status(201).json({
      success: true,
      message: 'Orden de compra creada exitosamente',
      data: nuevaOrden
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la orden de compra',
      error: error.message
    });
  }
};

// Listar todas las órdenes
const listarOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find();
    res.status(200).json({
      success: true,
      data: ordenes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al listar las órdenes de compra',
      error: error.message
    });
  }
};

// Obtener una orden por ID
const obtenerOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }
    res.status(200).json({
      success: true,
      data: orden
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden de compra',
      error: error.message
    });
  }
};

// Eliminar una orden
const eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByIdAndDelete(req.params.id);
    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Orden de compra eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la orden de compra',
      error: error.message
    });
  }
};

const completarOrden = async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await OrdenCompra.findById(id);
    if (!orden) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Actualizar stock de productos
    for (const item of orden.productos) {
      // Buscar producto por nombre (ajusta a _id si corresponde)
      const producto = await Producto.findOne({ name: item.producto });
      if (producto) {
        producto.stock = (producto.stock || 0) + item.cantidad;
        await producto.save();
      }
    }

    // Crear compra en historial
    const compraData = {
      numeroOrden: orden.numeroOrden,
      proveedor: orden.proveedor,
      solicitadoPor: orden.solicitadoPor,
      productos: orden.productos.map(p => ({
        producto: p.producto,
        descripcion: p.descripcion || '',
        cantidad: p.cantidad,
        precioUnitario: p.valorUnitario
      })),
      subtotal: orden.subtotal,
      impuestos: orden.impuestos,
      total: orden.total,
      observaciones: orden.observaciones || '',
      estado: 'Completada',
      _fromOrden: true
    };

    const nuevaCompra = await Compra.create(compraData);

    // Eliminar la orden original
    await OrdenCompra.findByIdAndDelete(id);

    res.status(200).json({ success: true, data: nuevaCompra });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};

// Editar orden de compra
const editarOrden = async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await OrdenCompra.findByIdAndUpdate(id, req.body, { new: true });
    if (!orden) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    res.status(200).json({ success: true, data: orden });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};

// Enviar orden de compra por correo (refactorado)
const enviarOrdenPorCorreo = async (req, res) => {
  try {
    const { id } = req.params;
    const { destinatario, asunto, mensaje } = req.body;

    if (!destinatario) return res.status(400).json({ success: false, message: 'Destinatario es requerido' });

    const orden = await OrdenCompra.findById(id);
    if (!orden) return res.status(404).json({ success: false, message: 'Orden de compra no encontrada' });

    // Poblar productos (no-fatal)
    await populateOrdenProductos(orden);

    const transporter = createGmailTransporter();
    if (!transporter) return res.status(500).json({ success: false, message: 'Servicio de correo no configurado. Verifica las credenciales de Gmail en el archivo .env' });

    const ordenHTML = generarHTMLOrden(orden, mensaje);
    const pdfAttachment = await generatePdfAttachmentSafeOrden(orden);

    const asuntoFinal = asunto || `Orden de Compra - N° ${orden.numeroOrden || 'N/A'} - JLA Global Company`;

    const mailOptions = {
      from: `"JLA Global Company" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asuntoFinal,
      html: ordenHTML,
      attachments: pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content, contentType: pdfAttachment.contentType }] : []
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: `¡Orden de compra enviada por correo exitosamente!${pdfAttachment ? ' con PDF adjunto' : ''}`, details: { destinatario, asunto: asuntoFinal, numeroOrden: orden.numeroOrden, pdfAdjunto: !!pdfAttachment, fecha: new Date().toLocaleString('es-CO') } });
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar correo', error: error.message });
  }
};

// Función para generar HTML profesional de la orden
function generarHTMLOrden(orden, mensajePersonalizado = '') {
  const totalCalculado = orden.productos.reduce((total, producto) => {
    const subtotal = Number(producto.cantidad * (producto.valorUnitario || producto.precioUnitario || 0)) || 0;
    return total + subtotal;
  }, 0);

  const totalFinal = Number(orden.total) || totalCalculado;
  const subtotalFinal = Number(orden.subtotal) || totalCalculado;

  // Generar filas de productos
  const productosHTML = orden.productos.map((p, index) => {
    const nombreProducto = p.producto?.name || p.nombre || 'Producto no especificado';
    const descripcionProducto = p.descripcion || p.producto?.description || 'N/A';
    const valorUnitario = p.valorUnitario || p.precioUnitario || 0;
    const subtotal = p.cantidad * valorUnitario;
    
    return `
      <tr data-label="Producto ${index + 1}">
        <td data-label="Producto">
          <strong>${nombreProducto}</strong><br/>
          <small style="color: #666;">${descripcionProducto}</small>
        </td>
        <td data-label="Cantidad">${p.cantidad}</td>
        <td data-label="Precio Unit.">$${Number(valorUnitario || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
      <title>Orden de Compra ${orden.numeroOrden}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .email-header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .email-body {
          padding: 30px;
        }
        .info-section {
          background: #f8f9fa;
          padding: 20px;
          margin-bottom: 25px;
          border-left: 4px solid #f39c12;
          border-radius: 5px;
        }
        .info-section h3 {
          color: #f39c12;
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 2px solid #f39c12;
          padding-bottom: 8px;
        }
        .info-section p {
          margin: 8px 0;
          color: #555;
          font-size: 14px;
        }
        .info-section strong {
          color: #333;
          font-weight: 600;
          display: inline-block;
          min-width: 150px;
        }
        .mensaje-personalizado {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin-bottom: 25px;
          border-radius: 5px;
        }
        .mensaje-personalizado p {
          margin: 0;
          color: #856404;
          white-space: pre-wrap;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        thead {
          background: #f39c12;
          color: white;
        }
        thead th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        tbody td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .total-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
          border: 2px solid #f39c12;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #dee2e6;
          font-size: 15px;
        }
        .total-row.final {
          border-bottom: none;
          font-size: 20px;
          font-weight: bold;
          color: #f39c12;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 3px solid #f39c12;
        }
        .email-footer {
          background: #2c3e50;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .email-footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🛒 ORDEN DE COMPRA</h1>
          <p>N° ${orden.numeroOrden || 'N/A'}</p>
        </div>

        <div class="email-body">
          ${mensajePersonalizado ? `
            <div class="mensaje-personalizado">
              <p><strong>📝 Mensaje:</strong></p>
              <p>${mensajePersonalizado}</p>
            </div>
          ` : ''}

          <div class="info-section">
            <h3>📋 Información General</h3>
            <p><strong>Número de Orden:</strong> ${orden.numeroOrden || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(orden.fechaOrden).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Estado:</strong> ${orden.estado || 'Pendiente'}</p>
            <p><strong>Solicitado Por:</strong> ${orden.solicitadoPor || 'No especificado'}</p>
          </div>

          <div class="info-section">
            <h3>🏢 Información del Proveedor</h3>
            <p><strong>Nombre:</strong> ${orden.proveedor || 'No especificado'}</p>
            <p><strong>Condiciones de Pago:</strong> ${orden.condicionesPago || 'Contado'}</p>
          </div>

          <h3 style="color: #f39c12; margin-top: 30px;">📦 Detalle de Productos</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosHTML}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span><strong>Subtotal:</strong></span>
              <span>$${subtotalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL:</span>
              <span>$${totalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div class="email-footer">
          <p><strong>JLA Global Company</strong></p>
          <p>Este es un correo electrónico automático, por favor no responder.</p>
          <p>Fecha de envío: ${new Date().toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>© ${new Date().getFullYear()} JLA Global Company. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  crearOrden,
  listarOrdenes,
  obtenerOrden,
  eliminarOrden,
  completarOrden,
  editarOrden,
  enviarOrdenPorCorreo
};
