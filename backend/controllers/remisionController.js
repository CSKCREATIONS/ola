const Remision = require('../models/Remision');
const Pedido = require('../models/Pedido');
const Counter = require('../models/Counter');
const nodemailer = require('nodemailer');
const PDFService = require('../services/pdfService');
const sgMail = require('@sendgrid/mail');

// Obtener todas las remisiones
exports.getAllRemisiones = async (req, res) => {
  try {
    const { estado, limite = 50, pagina = 1 } = req.query;
    
    let filtro = {};
    if (estado && estado !== 'todas') {
      filtro.estado = estado;
    }

    const remisiones = await Remision.find(filtro)
      .populate('responsable', 'username firstName surname')
      .populate('cotizacionReferencia', 'codigo')
      .sort({ fechaRemision: -1 })
      .limit(parseInt(limite))
      .skip((parseInt(pagina) - 1) * parseInt(limite));

    const total = await Remision.countDocuments(filtro);

    res.json({
      remisiones,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite))
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
    console.log(`📋 Creando remisión desde pedido ID: ${pedidoId}`);

    // Obtener el pedido con toda la información poblada
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ 
        message: 'Pedido no encontrado',
        error: 'PEDIDO_NOT_FOUND'
      });
    }

    // Verificar que el pedido esté en estado que permita crear remisión
    if (!['entregado', 'despachado'].includes(pedido.estado)) {
      return res.status(400).json({ 
        message: 'Solo se pueden crear remisiones de pedidos entregados o despachados',
        estadoActual: pedido.estado
      });
    }

    // Verificar si ya existe una remisión para este pedido
    const remisionExistente = await Remision.findOne({ pedidoReferencia: pedidoId });
    if (remisionExistente) {
      return res.status(200).json({
        message: 'Ya existe una remisión para este pedido',
        remision: remisionExistente,
        existente: true
      });
    }

    // Generar número de remisión automático
    const counter = await Counter.findByIdAndUpdate(
      'remision',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const numeroRemision = `REM-${String(counter.seq).padStart(5, '0')}`;

    // Calcular totales
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

    // Crear la remisión
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
      responsable: req.userId, // ID del usuario que crea la remisión
      estado: 'activa',
      total,
      cantidadItems: productos.length,
      cantidadTotal
    });

    const remisionGuardada = await nuevaRemision.save();
    
    // Poblar datos para la respuesta
    await remisionGuardada.populate('responsable', 'username firstName surname');

    console.log(`✅ Remisión creada: ${numeroRemision} para pedido ${pedido.numeroPedido}`);

    res.status(201).json({
      message: 'Remisión creada exitosamente',
      remision: remisionGuardada,
      creada: true
    });

  } catch (error) {
    console.error('❌ Error al crear remisión desde pedido:', error);
    res.status(500).json({ 
      message: 'Error al crear remisión',
      error: error.message 
    });
  }
};

// Obtener una remisión por ID
exports.getRemisionById = async (req, res) => {
  try {
    const remision = await Remision.findById(req.params.id)
      .populate('responsable', 'username firstName surname')
      .populate('cotizacionReferencia', 'codigo')
      .populate('pedidoReferencia');

    if (!remision) {
      return res.status(404).json({ message: 'Remisión no encontrada' });
    }

    res.json(remision);
  } catch (error) {
    console.error('Error al obtener remisión:', error);
    res.status(500).json({ message: 'Error al obtener remisión', error: error.message });
  }
};

// Actualizar estado de remisión
exports.updateEstadoRemision = async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!['activa', 'cerrada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const remision = await Remision.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!remision) {
      return res.status(404).json({ message: 'Remisión no encontrada' });
    }

    res.json({ 
      message: 'Estado actualizado correctamente',
      remision 
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// Obtener estadísticas de remisiones
exports.getEstadisticasRemisiones = async (req, res) => {
  try {
    const estadisticas = await Remision.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);

    const totalRemisiones = await Remision.countDocuments();
    const valorTotal = await Remision.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalRemisiones,
      valorTotal: valorTotal[0]?.total || 0,
      porEstado: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};

// Enviar remisión por correo electrónico
exports.enviarRemisionPorCorreo = async (req, res) => {
  try {
    console.log(`📧 Iniciando envío de remisión por correo. ID: ${req.params.id}`);
    console.log('📋 Body recibido:', req.body);
    
    const { remisionId, correoDestino, asunto, mensaje } = req.body;
    
    // Validar datos requeridos
    if (!correoDestino || !asunto || !mensaje) {
      return res.status(400).json({ 
        message: 'Correo destinatario, asunto y mensaje son obligatorios' 
      });
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoDestino)) {
      return res.status(400).json({ 
        message: 'El formato del correo electrónico no es válido' 
      });
    }

    // Obtener la remisión
    const remision = await Remision.findById(req.params.id)
      .populate('responsable', 'username firstName surname')
      .populate('cotizacionReferencia', 'codigo');

    if (!remision) {
      console.log(`❌ Remisión no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ 
        message: 'Remisión no encontrada',
        id: req.params.id,
        error: 'REMISION_NOT_FOUND'
      });
    }

    // Verificar que la remisión tenga productos
    if (!remision.productos || remision.productos.length === 0) {
      return res.status(400).json({ message: 'La remisión no tiene productos asociados' });
    }

    console.log('📋 Datos de la remisión para envío:', {
      numeroRemision: remision.numeroRemision,
      cliente: remision.cliente?.nombre,
      cantidadProductos: remision.productos?.length,
      total: remision.total,
      productos: remision.productos?.map(p => ({
        nombre: p.nombre,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        total: p.total
      }))
    });

    // Generar PDF de la remisión
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la remisión...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFRemision(remision);
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

    // Configurar SendGrid si está disponible y la API key es válida
    const sgKey = process.env.SENDGRID_API_KEY;
    if (sgKey && sgKey.startsWith('SG.')) {
      console.log('🔧 SendGrid configurado (API key presente)');
      try {
        sgMail.setApiKey(sgKey);
      } catch (e) {
        console.warn('⚠️ No se pudo configurar SendGrid:', e.message);
      }
    } else if (sgKey) {
      console.log('⚠️ SENDGRID_API_KEY presente pero inválida (no inicia con "SG.")');
    } else {
      console.log('⚠️ SENDGRID_API_KEY no configurada');
    }

    // Generar contenido HTML de la remisión
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Remisión ${remision.numeroRemision}</title>
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
            <h1>📄 REMISIÓN</h1>
            <p>Documento de entrega No. <strong>${remision.numeroRemision}</strong></p>
            <span class="status-badge">${remision.estado?.toUpperCase() || 'ACTIVA'}</span>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Info Grid -->
            <div class="info-grid">
              <!-- Cliente -->
              <div class="info-card">
                <h3>👤 Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${remision.cliente?.nombre || 'N/A'}</p>
                <p><strong>Correo:</strong> ${remision.cliente?.correo || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${remision.cliente?.telefono || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${remision.cliente?.direccion || 'N/A'}</p>
                <p><strong>Ciudad:</strong> ${remision.cliente?.ciudad || 'N/A'}</p>
              </div>

              <!-- Remisión -->
              <div class="info-card">
                <h3>📋 Detalles de la Remisión</h3>
                <p><strong>Fecha:</strong> ${new Date(remision.fechaRemision).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Estado:</strong> ${remision.estado || 'N/A'}</p>
                <p><strong>Responsable:</strong> ${remision.responsable?.firstName || ''} ${remision.responsable?.surname || ''}</p>
                <p><strong>Items:</strong> ${remision.productos?.length || 0} productos</p>
                <p><strong>Cantidad Total:</strong> ${remision.cantidadTotal || 0} unidades</p>
              </div>
            </div>

            <!-- Products Section -->
            <div class="products-section">
              <h2 class="products-title">🛍️ Productos Entregados</h2>
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
                  ${remision.productos.map((producto, index) => `
                    <tr>
                      <td data-label="Producto:">
                        <strong>${producto.descripcion || producto.nombre || 'N/A'}</strong>
                        ${producto.codigo ? `<br><small style="color: #666;">Código: ${producto.codigo}</small>` : ''}
                      </td>
                      <td data-label="Cantidad:" style="text-align: center; font-weight: bold;">${producto.cantidad || 0}</td>
                      <td data-label="Precio Unit.:" style="text-align: right;">$${(producto.precioUnitario || 0).toLocaleString('es-ES')}</td>
                      <td data-label="Total:" style="text-align: right; font-weight: bold;">$${(producto.total || 0).toLocaleString('es-ES')}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td data-label="TOTAL:" colspan="3" style="text-align: right; font-size: 1.2em;">💰 <strong>TOTAL GENERAL:</strong></td>
                    <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>$${(remision.total || 0).toLocaleString('es-ES')}</strong></td>
                  </tr>
                </tfoot>
              </table>
              
              <!-- Mobile Total Summary -->
              <div class="mobile-total">
                💰 Total General: $${(remision.total || 0).toLocaleString('es-ES')}
              </div>
            </div>

            <!-- Message Section -->
            <div class="message-section">
              <h3>💬 Mensaje</h3>
              <p>${mensaje}</p>
            </div>

            ${remision.observaciones ? `
            <!-- Observaciones -->
            <div class="info-card" style="margin-top: 20px;">
              <h3>📝 Observaciones</h3>
              <p>${remision.observaciones}</p>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>${process.env.COMPANY_NAME || 'Sistema de Gestión'}</strong></p>
            <p>📧 ${process.env.EMAIL_USER || process.env.GMAIL_USER || 'contacto@empresa.com'} | 📞 ${process.env.COMPANY_PHONE || 'Tel: (555) 123-4567'}</p>
            <p style="margin-top: 15px; font-size: 0.9em;">
              Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;
    let lastError = null;

    // Intentar envío con Gmail SMTP primero
    if ((process.env.EMAIL_USER || process.env.GMAIL_USER) && (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) {
      try {
        console.log('🔄 Intentando envío con Gmail SMTP...');
        const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
        const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
        
        console.log('📧 Email de origen:', emailUser);
        console.log('📬 Email de destino:', correoDestino);
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });

        await transporter.sendMail({
          from: `"${process.env.COMPANY_NAME || 'Sistema de Remisiones'}" <${emailUser}>`,
          to: correoDestino,
          subject: asunto,
          html: htmlContent,
          text: mensaje,
          attachments: pdfAttachment ? [{
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
            contentType: pdfAttachment.contentType
          }] : []
        });

        emailSent = true;
        console.log('✅ Correo enviado exitosamente con Gmail SMTP');
        
      } catch (error) {
        console.error('❌ Error detallado con Gmail SMTP:', {
          message: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
          stack: error.stack
        });
        
        // Mostrar información específica de Gmail
        if (error.code === 'EAUTH') {
          console.error('🔐 Error de autenticación Gmail: Verifique EMAIL_USER y EMAIL_PASS');
        } else if (error.code === 'ESOCKET') {
          console.error('🌐 Error de conexión Gmail: Problema de red o firewall');
        }
        
        lastError = error;
      }
    } else {
      console.log('⚠️ Gmail SMTP no configurado (falta EMAIL_USER/GMAIL_USER o EMAIL_PASS/GMAIL_APP_PASSWORD)');
    }

    // Si Gmail falló, intentar con SendGrid
  if (!emailSent && process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      try {
  console.log('🔄 Intentando envío con SendGrid...');
  const fromEmail = process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL;
        console.log('📧 FROM_EMAIL:', fromEmail);
        console.log('📬 Email de destino:', correoDestino);
        
        // Verificar que FROM_EMAIL esté configurado
        if (!fromEmail) {
          throw new Error('FROM_EMAIL/SENDGRID_FROM_EMAIL no está configurado para SendGrid');
        }

  await sgMail.send({
          to: correoDestino,
          from: fromEmail,
          subject: asunto,
          html: htmlContent,
          text: mensaje,
          attachments: pdfAttachment ? [{
            content: pdfAttachment.content.toString('base64'),
            filename: pdfAttachment.filename,
            type: pdfAttachment.contentType,
            disposition: 'attachment'
          }] : []
        });

        emailSent = true;
        console.log('✅ Correo enviado exitosamente con SendGrid');
        
      } catch (error) {
        console.error('❌ Error detallado con SendGrid:', {
          message: error.message,
          code: error.code,
          response: error.response?.body || error.response,
          errors: error.response?.body?.errors || []
        });
        
        // Solo mostrar errores detallados en modo debug o producción
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (!isDevelopment || process.env.DEBUG_EMAIL === 'true') {
          // Mostrar errores específicos de SendGrid
          if (error.response?.body?.errors) {
            error.response.body.errors.forEach((err, index) => {
              console.error(`❌ SendGrid Error ${index + 1}:`, err);
            });
          }
        }
        
        lastError = error;
      }
  } else if (!emailSent) {
  console.log('⚠️ SendGrid no configurado correctamente (falta SENDGRID_API_KEY o formato inválido)');
    }

    if (emailSent) {
      console.log('✅ Correo enviado exitosamente con proveedor real');
      res.json({ 
        message: 'Remisión enviada por correo exitosamente',
        destinatario: correoDestino,
        asunto: asunto,
        proveedor: 'Real'
      });
      return; // Importante: salir aquí para evitar logs adicionales
    } else {
      // En desarrollo, simular envío exitoso para no bloquear la funcionalidad
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (isDevelopment) {
        console.log('🧪 Modo desarrollo: Simulando envío exitoso de correo');
        console.log('📧 Detalles del correo simulado:');
        console.log(`   - Para: ${correoDestino}`);
        console.log(`   - Asunto: ${asunto}`);
        console.log(`   - Remisión: ${remision.numeroRemision}`);
        
        res.json({ 
          message: 'Remisión enviada por correo exitosamente (modo desarrollo)',
          destinatario: correoDestino,
          asunto: asunto,
          simulado: true,
          proveedor: 'Simulado - Desarrollo',
          nota: 'En producción, configure correctamente Gmail SMTP o SendGrid'
        });
        return; // Importante: salir aquí para evitar logs adicionales
      } else {
        // Solo mostrar error en producción
        console.error('❌ No se pudo enviar el correo con ningún proveedor');
        
        // En producción, devolver error real
        res.status(500).json({ 
          message: 'Error al enviar correo',
          error: lastError?.message || 'Error desconocido en los proveedores de correo',
          detalles: 'Verifique la configuración de Gmail SMTP o SendGrid',
          configuracion: {
            gmail: !!(process.env.GMAIL_USER || process.env.EMAIL_USER),
            sendgrid: !!process.env.SENDGRID_API_KEY
          }
        });
        return;
      }
    }

  } catch (error) {
    console.error('❌ Error general al enviar remisión:', error);
    res.status(500).json({ 
      message: 'Error al enviar remisión por correo', 
      error: error.message 
    });
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