// controllers/pedidoController.js
const Pedido = require('../models/Pedido');
const Venta = require('../models/venta'); // Asegúrate de tener el modelo importado
const Product = require('../models/Products'); // para calcular precios
const Cotizacion = require('../models/cotizaciones');
const Counter = require('../models/Counter');
const Cliente = require('../models/Cliente');
const Remision = require('../models/Remision');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const PDFService = require('../services/pdfService');

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




exports.getPedidos = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = estado ? { estado } : {};
    const pedidos = await Pedido.find(filtro).populate('cliente').populate('productos.product');
    
    // Calcular el total para cada pedido
    const pedidosConTotal = pedidos.map(pedido => {
      const total = pedido.productos.reduce((sum, prod) => {
        const cantidad = prod.cantidad || 0;
        const precio = prod.precioUnitario || 0;
        return sum + (cantidad * precio);
      }, 0);
      
      return {
        ...pedido.toObject(),
        total
      };
    });
    
    res.json(pedidosConTotal);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
};


// Crear pedido
exports.createPedido = async (req, res) => {
  try {
    let { cliente, productos, fechaEntrega, observacion, cotizacionReferenciada, cotizacionCodigo } = req.body;

    // If cliente is an object (not an ID), find or create the Cliente and get its _id
    let clienteId = null;
    if (!cliente) {
      return res.status(400).json({ message: 'Falta información del cliente' });
    }

    if (typeof cliente === 'string' && mongoose.Types.ObjectId.isValid(cliente)) {
      clienteId = cliente;
    } else if (cliente && typeof cliente === 'object') {
      // Prefer finding by correo if provided
      if (cliente._id && mongoose.Types.ObjectId.isValid(cliente._id)) {
        clienteId = cliente._id;
      } else if (cliente.correo) {
        let clienteExistente = await Cliente.findOne({ correo: cliente.correo.toLowerCase() });
        if (!clienteExistente) {
          const nuevoCliente = new Cliente({
            nombre: cliente.nombre || cliente.nombreCliente || '',
            correo: (cliente.correo || '').toLowerCase(),
            telefono: cliente.telefono || clienteTelefono || '',
            direccion: cliente.direccion || '',
            ciudad: cliente.ciudad || '',
            esCliente: false
          });
          clienteExistente = await nuevoCliente.save();
        }
        clienteId = clienteExistente._id;
      } else {
        // If no correo, create a new Cliente document
        const nuevoCliente = new Cliente({
          nombre: cliente.nombre || '',
          correo: cliente.correo || '',
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          ciudad: cliente.ciudad || '',
          esCliente: false
        });
        const creado = await nuevoCliente.save();
        clienteId = creado._id;
      }
    }

    // Map productos payload to schema expected by Pedido model
    const productosMapped = (productos || []).map(item => {
      // frontend may send producto: { id: '...', name: '...' } or producto: 'id'
      const prodId = (item.producto && (item.producto.id || item.producto)) || item.product || null;
      return {
        product: prodId,
        cantidad: item.cantidad || item.cantidad === 0 ? item.cantidad : (item.cantidad || 0),
        precioUnitario: item.precioUnitario || item.valorUnitario || 0
      };
    });

    // Generar número de pedido único de forma atómica usando colección Counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'pedido' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numeroPedido = `PED-${String(counter.seq).padStart(5, '0')}`;

    const nuevoPedido = new Pedido({
      numeroPedido,
      cliente: clienteId,
      productos: productosMapped,
      fechaEntrega,
      observacion,
      cotizacionReferenciada,
      cotizacionCodigo
    });

    let pedidoGuardado;
    try {
      pedidoGuardado = await nuevoPedido.save();
    } catch (saveErr) {
      // En caso de duplicado (raro), reintentar generando nuevo seq
      if (saveErr && saveErr.code === 11000) {
        const counter2 = await Counter.findOneAndUpdate(
          { _id: 'pedido' },
          { $inc: { seq: 1 } },
          { new: true }
        );
        const numeroPedido2 = `PED-${String(counter2.seq).padStart(5, '0')}`;
        nuevoPedido.numeroPedido = numeroPedido2;
        pedidoGuardado = await nuevoPedido.save();
      } else {
        throw saveErr;
      }
    }

    // Si el pedido se creó desde una cotización, marcarla como agendada
    if (cotizacionReferenciada) {
      try {
        await Cotizacion.findByIdAndUpdate(
          cotizacionReferenciada,
          {
            agendada: true,
            pedidoReferencia: pedidoGuardado._id
          }
        );
        console.log(`✅ Cotización ${cotizacionCodigo} marcada como agendada`);
      } catch (cotError) {
        console.error('⚠️ Error al marcar cotización como agendada:', cotError);
        // No fallar el pedido por este error
      }
    }

    // Actualizar el estado del cliente a "esCliente: true" cuando se agenda un pedido
    try {
      await Cliente.findByIdAndUpdate(
        clienteId,
        { esCliente: true },
        { new: true }
      );
      console.log(`✅ Cliente ${clienteId} marcado como cliente activo (esCliente: true)`);
    } catch (clienteError) {
      console.error('⚠️ Error al actualizar estado del cliente:', clienteError);
      // No fallar el pedido por este error
    }

    res.status(201).json(pedidoGuardado);
  } catch (err) {
    console.error('❌ Error al crear pedido:', err);
    res.status(500).json({ message: 'Error al crear el pedido', error: err.message });
  }
};

exports.getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findById(id)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Calcular el total del pedido
    const total = pedido.productos.reduce((sum, prod) => {
      const cantidad = prod.cantidad || 0;
      const precio = prod.precioUnitario || 0;
      return sum + (cantidad * precio);
    }, 0);

    const pedidoConTotal = {
      ...pedido.toObject(),
      total
    };

    res.status(200).json(pedidoConTotal);
  } catch (error) {
    console.error('❌ Error al obtener pedido por ID:', error);
    res.status(500).json({ message: 'Error al obtener el pedido', error });
  }
};


exports.cambiarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pedido = await Pedido.findById(id).populate('productos.product');
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Si el nuevo estado es 'entregado', actualizar el stock de los productos
    if (estado === 'entregado') {
      const Products = require('../models/Products');
      
      for (const item of pedido.productos) {
        if (item.product) {
          const producto = await Products.findById(item.product._id);
          if (producto) {
            // Verificar que hay suficiente stock
            if (producto.stock < item.cantidad) {
              return res.status(400).json({ 
                message: `Stock insuficiente para ${producto.name}. Stock actual: ${producto.stock}, requerido: ${item.cantidad}` 
              });
            }
            
            // Disminuir el stock
            producto.stock -= item.cantidad;
            await producto.save();
            
            console.log(`📦 Stock actualizado: ${producto.name} - Stock anterior: ${producto.stock + item.cantidad}, Stock nuevo: ${producto.stock}`);
          }
        }
      }
    }

    pedido.estado = estado;
    await pedido.save();

    res.json({ message: 'Estado del pedido actualizado', pedido });
  } catch (err) {
    console.error('Error al cambiar el estado del pedido:', err);
    res.status(500).json({ message: 'Error interno al cambiar estado del pedido', error: err.message });
  }
};


exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    const pedido = await Pedido.findById(id)
      .populate('productos.product') // importante que el campo sea productos.product
      .populate('cliente');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    pedido.estado = nuevoEstado;
    await pedido.save();

    // Si el nuevo estado es 'entregado', registrar la venta
    if (nuevoEstado === 'entregado') {
      const productosVenta = pedido.productos.map(item => {
        if (!item.product || item.product.precio == null) {
          throw new Error(`Falta el precio del producto: ${item.product?._id}`);
        }

        return {
          producto: item.product._id,
          cantidad: item.cantidad,
          precioUnitario: item.product.precio
        };
      });

      const total = productosVenta.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

      const venta = new Venta({
        cliente: pedido.cliente._id,
        productos: productosVenta,
        total,
        estado: 'completado',
        pedidoReferenciado: pedido._id,
        fecha: new Date()
      });

      await venta.save();
    }

    res.status(200).json({ message: 'Estado del pedido actualizado correctamente' });

  } catch (error) {
    console.error('❌ Error al actualizar estado del pedido:', error);
    res.status(500).json({ message: 'Error al actualizar estado del pedido', error });
  }
};



exports.marcarComoEntregado = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('productos.product') // Asegúrate que el campo se llama "productos.product"
      .populate('cliente');

    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Actualizar el stock de los productos antes de marcar como entregado
    const Products = require('../models/Products');
    
    for (const item of pedido.productos) {
      if (item.product) {
        const producto = await Products.findById(item.product._id);
        if (producto) {
          // Verificar que hay suficiente stock
          if (producto.stock < item.cantidad) {
            return res.status(400).json({ 
              message: `Stock insuficiente para ${producto.name}. Stock actual: ${producto.stock}, requerido: ${item.cantidad}` 
            });
          }
          
          // Disminuir el stock
          producto.stock -= item.cantidad;
          await producto.save();
          
          console.log(`📦 Stock actualizado: ${producto.name} - Stock anterior: ${producto.stock + item.cantidad}, Stock nuevo: ${producto.stock}`);
        }
      }
    }

    // Cambiar estado
    pedido.estado = 'entregado';
    await pedido.save();

    // Construir productosVenta con precioUnitario
    const productosVenta = pedido.productos.map(item => {
      if (!item.product || item.product.precio == null) {
        throw new Error(`Falta el precio del producto: ${item.product?._id}`);
      }

      return {
        producto: item.product._id,
        cantidad: item.cantidad,
        precioUnitario: item.product.precio
      };
    });

    // Calcular total
    const total = productosVenta.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

    // Registrar venta
    const venta = new Venta({
      cliente: pedido.cliente._id,
      productos: productosVenta,
      total,
      estado: 'completado',
      pedidoReferenciado: pedido._id,
      fecha: new Date()
    });

    await venta.save();

    res.json({ message: 'Pedido entregado y venta registrada correctamente', venta });

  } catch (error) {
    console.error('❌ Error al entregar pedido y crear venta:', error);
    res.status(500).json({ message: 'Error al entregar pedido y crear venta' });
  }
};

// Crear remisión desde pedido entregado
exports.crearRemisionDesdePedido = async (req, res) => {
  try {
    const pedidoId = req.params.id; // Obtener ID del parámetro de ruta
    const { observaciones, numeroRemision, fechaEntrega } = req.body;

    console.log('🔍 Creando remisión para pedido:', pedidoId);
    console.log('📝 Datos recibidos:', { observaciones, numeroRemision, fechaEntrega });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate({
        path: 'productos.product',
        select: 'name price description'
      });

    if (!pedido) {
      console.log('❌ Pedido no encontrado:', pedidoId);
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    console.log('📦 Estado del pedido:', pedido.estado);
    console.log('📦 Productos en pedido:', pedido.productos?.length || 0);
    
    // Debug: mostrar estructura de productos
    if (pedido.productos && pedido.productos.length > 0) {
      console.log('🔍 Estructura del primer producto:');
      console.log(JSON.stringify(pedido.productos[0], null, 2));
    }

    // Verificar que el pedido esté entregado (puede ser 'entregado' o 'completado')
    if (pedido.estado !== 'entregado' && pedido.estado !== 'completado') {
      return res.status(400).json({ 
        message: 'Solo se pueden crear remisiones de pedidos entregados',
        estadoActual: pedido.estado
      });
    }

    // Verificar que tenga productos
    if (!pedido.productos || pedido.productos.length === 0) {
      console.log('❌ El pedido no tiene productos');
      return res.status(400).json({ 
        message: 'El pedido no tiene productos asociados'
      });
    }

    // Crear la remisión con manejo robusto de productos
    const productos = pedido.productos.map((p, index) => {
      // Manejar la estructura correcta del modelo Pedido
      let nombre, precio, cantidad;
      
      if (p.product && typeof p.product === 'object') {
        // Si product está populado
        nombre = p.product.name || 'Producto sin nombre';
        precio = parseFloat(p.precioUnitario) || parseFloat(p.product.price) || 0;
      } else {
        // Si no está populado, usar datos directos
        nombre = `Producto ID: ${p.product}`;
        precio = parseFloat(p.precioUnitario) || 0;
      }

      cantidad = parseInt(p.cantidad) || 1;
      const total = cantidad * precio;

      console.log(`📦 Producto ${index + 1}:`, {
        nombre,
        cantidad,
        precio,
        total: total.toFixed(2)
      });

      return {
        nombre: nombre,
        cantidad: cantidad,
        precioUnitario: precio,
        precio: precio, // Mantener compatibilidad
        total: parseFloat(total.toFixed(2)),
        descripcion: p.product?.description || '',
        codigo: p.product?._id || p.product || ''
      };
    });

    console.log('📦 Productos procesados:', productos.length);

    // Calcular totales
    const subtotal = productos.reduce((sum, p) => sum + p.total, 0);
    const totalGeneral = parseFloat(subtotal.toFixed(2));

    console.log('💰 Cálculos financieros:');
    console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`   Total: $${totalGeneral.toFixed(2)}`);

    // Crear la remisión
    const remision = {
      numeroRemision: numeroRemision || `REM-${Date.now()}`,
      pedidoReferencia: pedidoId,
      codigoPedido: pedido.codigo || pedido.numeroPedido,
      cliente: {
        nombre: pedido.cliente?.nombre || 'Cliente sin nombre',
        correo: pedido.cliente?.correo || '',
        telefono: pedido.cliente?.telefono || '',
        ciudad: pedido.cliente?.ciudad || ''
      },
      productos: productos,
      fechaRemision: new Date(),
      fechaEntrega: fechaEntrega || pedido.fechaEntrega || new Date(),
      observaciones: observaciones || 'Remisión generada desde pedido entregado',
      responsable: req.user?.id || null,
      estado: 'activa',
      subtotal: subtotal,
      total: totalGeneral,
      cantidadItems: productos.length,
      cantidadTotal: productos.reduce((sum, p) => sum + p.cantidad, 0)
    };

    console.log('✅ Remisión creada:', remision.numeroRemision);
    console.log('📋 Resumen de la remisión:');
    console.log(`   - Cliente: ${remision.cliente.nombre}`);
    console.log(`   - Productos: ${remision.cantidadItems} items`);
    console.log(`   - Cantidad total: ${remision.cantidadTotal} unidades`);
    console.log(`   - Total: $${remision.total}`);

    // Guardar la remisión en la base de datos
    try {
      const nuevaRemision = new Remision(remision);
      const remisionGuardada = await nuevaRemision.save();
      
      console.log('💾 Remisión guardada en BD con ID:', remisionGuardada._id);
      
      res.status(201).json({ 
        message: 'Remisión creada y guardada exitosamente',
        remision: remisionGuardada,
        success: true
      });
    } catch (saveError) {
      console.error('❌ Error guardando remisión:', saveError);
      
      // Si hay error guardando, al menos devolver la remisión generada
      res.status(201).json({ 
        message: 'Remisión creada exitosamente (advertencia: no se pudo guardar en BD)',
        remision: remision,
        success: true,
        warning: 'La remisión se generó pero no se guardó en la base de datos'
      });
    }
  } catch (error) {
    console.error('❌ Error creando remisión:', error);
    res.status(500).json({ 
      message: 'Error al crear remisión', 
      error: error.message,
      success: false
    });
  }
};



// Enviar pedido agendado por correo
exports.enviarPedidoAgendadoPorCorreo = async (req, res) => {
  try {
    console.log('🚀 === EJECUTANDO FUNCIÓN: enviarPedidoAgendadoPorCorreo ===');
    console.log('📍 ENDPOINT: /pedidos/:id/enviar-agendado');
    console.log('🎯 FUNCIÓN ESPERADA: Generar contenido de PEDIDO AGENDADO');
    
    const { correoDestino, asunto, mensaje } = req.body;
    const pedidoId = req.params.id;

    console.log('🔍 Iniciando envío de correo para pedido agendado:', pedidoId);

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente?.correo;
    const asuntoFinal = asunto || `Pedido Agendado ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;

    // Generar PDF del pedido
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF del pedido agendado...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFPedido(pedido, 'agendado');
      pdfAttachment = {
        filename: pdfData.filename,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF generado exitosamente:', pdfData.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError.message);
    }

    console.log('📄 VERIFICACIÓN: Vamos a generar HTML de PEDIDO AGENDADO');
    console.log('📋 Datos del pedido:', {
      numero: pedido.numeroPedido,
      cliente: pedido.cliente?.nombre,
      productos: pedido.productos?.length,
      tipo: 'PEDIDO (no cotización)'
    });

    const htmlContent = generarHTMLPedidoAgendado(pedido, mensaje);
    
    console.log('✅ HTML generado para PEDIDO AGENDADO');
    console.log('🔍 Verificando contenido HTML...');
    const contieneCorrectas = htmlContent.includes('PEDIDO AGENDADO') && htmlContent.includes('Productos Agendados');
    const contieneIncorrectas = htmlContent.includes('COTIZACIÓN') || htmlContent.includes('cotización');
    console.log('✅ Contiene palabras de PEDIDO:', contieneCorrectas);
    console.log('❌ Contiene palabras de COTIZACIÓN:', contieneIncorrectas);

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.status(200).json({ 
      message: 'Pedido agendado enviado por correo exitosamente',
      destinatario,
      pedido: pedido.numeroPedido
    });

  } catch (error) {
    console.error('❌ Error enviando pedido agendado:', error);
    res.status(500).json({ message: 'Error al enviar pedido por correo', error: error.message });
  }
};

// Enviar pedido devuelto por correo
exports.enviarPedidoDevueltoPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje, motivoDevolucion } = req.body;
    const pedidoId = req.params.id;

    console.log('🔍 Iniciando envío de correo para pedido devuelto:', pedidoId);

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente?.correo;
    const asuntoFinal = asunto || `Pedido Devuelto ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;

    // Generar PDF del pedido
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF del pedido devuelto...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFPedido(pedido, 'devuelto');
      pdfAttachment = {
        filename: pdfData.filename,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF generado exitosamente:', pdfData.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError.message);
    }

    const htmlContent = generarHTMLPedidoDevuelto(pedido, mensaje, motivoDevolucion);

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.status(200).json({ 
      message: 'Pedido devuelto enviado por correo exitosamente',
      destinatario,
      pedido: pedido.numeroPedido
    });

  } catch (error) {
    console.error('❌ Error enviando pedido devuelto:', error);
    res.status(500).json({ message: 'Error al enviar pedido por correo', error: error.message });
  }
};

// Enviar pedido cancelado por correo
exports.enviarPedidoCanceladoPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje, motivoCancelacion } = req.body;
    const pedidoId = req.params.id;

    console.log('🔍 Iniciando envío de correo para pedido cancelado:', pedidoId);

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente?.correo;
    const asuntoFinal = asunto || `Pedido Cancelado ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;

    // Generar PDF del pedido
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF del pedido cancelado...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFPedido(pedido, 'cancelado');
      pdfAttachment = {
        filename: pdfData.filename,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF generado exitosamente:', pdfData.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError.message);
    }

    const htmlContent = generarHTMLPedidoCancelado(pedido, mensaje, motivoCancelacion);

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.status(200).json({ 
      message: 'Pedido cancelado enviado por correo exitosamente',
      destinatario,
      pedido: pedido.numeroPedido
    });

  } catch (error) {
    console.error('❌ Error enviando pedido cancelado:', error);
    res.status(500).json({ message: 'Error al enviar pedido por correo', error: error.message });
  }
};

// Función auxiliar para enviar correos con adjuntos (mejorada con el patrón de cotizaciones)
async function enviarCorreoConAttachment(destinatario, asunto, htmlContent, pdfAttachment) {
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
      console.log('📧 Enviando con Gmail...');
      
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'JLA Global Company'}" <${process.env.GMAIL_USER}>`,
        to: destinatario,
        subject: asunto,
        html: htmlContent,
        attachments: pdfAttachment ? [{
          filename: pdfAttachment.filename,
          content: pdfAttachment.content,
          contentType: pdfAttachment.contentType
        }] : []
      };

      await gmailTransporter.sendMail(mailOptions);
      console.log('✅ Correo enviado exitosamente con Gmail');
      return;

    } catch (gmailError) {
      console.error('❌ Error con Gmail:', gmailError.message);
      console.error('❌ Código de error Gmail:', gmailError.code);
      console.error('❌ Detalles del error Gmail:', gmailError.response || 'Sin detalles adicionales');
      console.log('🔄 Intentando con SendGrid como fallback...');
    }
  }

  // Intentar con SendGrid si Gmail falló o no está configurado
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

// Función auxiliar para generar HTML de pedido agendado
function generarHTMLPedidoAgendado(pedido, mensaje) {
  // Calcular totales
  const totalProductos = pedido.productos?.length || 0;
  const cantidadTotal = pedido.productos?.reduce((total, p) => total + (p.cantidad || 0), 0) || 0;
  const totalPedido = pedido.total || pedido.productos?.reduce((total, p) => total + ((p.cantidad || 0) * (p.precioUnitario || 0)), 0) || 0;

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
          background: linear-gradient(135deg, #007bff, #0056b3); 
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
            background: #20c997; 
            color: white; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { background: #f8f9fa; }
          .mobile-total { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ PEDIDO AGENDADO</h1>
          <p>Documento de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">AGENDADO</span>
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
              <p><strong>Fecha:</strong> ${new Date(pedido.createdAt).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Fecha de Entrega:</strong> ${pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Por definir'}</p>
              <p><strong>Estado:</strong> Agendado</p>
              <p><strong>Responsable:</strong> Sistema</p>
              <p><strong>Items:</strong> ${totalProductos} productos</p>
              <p><strong>Cantidad Total:</strong> ${cantidadTotal} unidades</p>
            </div>
          </div>

          <div class="products-section">
            <h2 class="products-title">🛍️ Productos Agendados</h2>
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
            <p>${mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, nos complace informarle que su pedido ha sido agendado exitosamente y será procesado en las fechas indicadas. Encontrará adjunto el documento completo con los detalles de su pedido. Para cualquier consulta, no dude en contactarnos.`}</p>
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

// Función auxiliar para generar HTML de pedido devuelto
function generarHTMLPedidoDevuelto(pedido, mensaje, motivoDevolucion) {
  // Calcular totales
  const totalProductos = pedido.productos?.length || 0;
  const cantidadTotal = pedido.productos?.reduce((total, p) => total + (p.cantidad || 0), 0) || 0;
  const totalPedido = pedido.total || pedido.productos?.reduce((total, p) => total + ((p.cantidad || 0) * (p.precioUnitario || 0)), 0) || 0;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Devuelto ${pedido.numeroPedido}</title>
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
          background: linear-gradient(135deg, #ff9800, #f57c00); 
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
          background: #fff3e0; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #ff9800; 
          margin-bottom: 15px;
        }
        .info-card h3 { 
          color: #ff9800; 
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
          background: #ff9800; 
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
          color: #ff9800; 
          font-size: 0.9em; 
        }
        .mobile-total {
          display: block;
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
          font-size: 1.2em;
          font-weight: bold;
        }
        .message-section { 
          background: linear-gradient(135deg, #dc3545, #c82333); 
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
          background: #ff9800; 
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
            background: #f57c00; 
            color: white; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { background: #fff3e0; }
          .mobile-total { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>↩️ PEDIDO DEVUELTO</h1>
          <p>Documento de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">DEVUELTO</span>
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
              <p><strong>Estado:</strong> Devuelto</p>
              <p><strong>Responsable:</strong> Sistema</p>
              <p><strong>Items:</strong> ${totalProductos} productos</p>
              <p><strong>Cantidad Total:</strong> ${cantidadTotal} unidades</p>
              ${motivoDevolucion ? '<p><strong>Motivo de Devolución:</strong> ' + motivoDevolucion + '</p>' : ''}
            </div>
          </div>

          <div class="products-section">
            <h2 class="products-title">🛍️ Productos Devueltos</h2>
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
            <p>${mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, le informamos que su pedido ha sido devuelto. Lamentamos cualquier inconveniente que esto pueda causar. Encontrará adjunto el documento con los detalles del pedido devuelto. Para cualquier consulta sobre esta devolución, no dude en contactarnos.`}</p>
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

// Función auxiliar para generar HTML de pedido cancelado
function generarHTMLPedidoCancelado(pedido, mensaje, motivoCancelacion) {
  // Calcular totales
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



// === FUNCIONES NUEVAS DE ENVÍO DE CORREO ===

// Enviar pedido por correo (general) - Basado en el patrón exitoso de cotizaciones
exports.enviarPedidoPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body;
    const pedidoId = req.params.id;

    console.log('🔍 Iniciando envío de correo para pedido:', pedidoId);
    console.log('📧 Datos de envío:', { correoDestino, asunto });

    // Obtener el pedido con los datos necesarios
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente.correo;
    const asuntoFinal = asunto || `Pedido Agendado ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    const mensajeFinal = mensaje || `Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, le enviamos la confirmación de su pedido agendado ${pedido.numeroPedido}.`;

    // Generar HTML del pedido usando la función corregida
    const htmlContent = generarHTMLPedidoAgendado(pedido, mensajeFinal);

    // Generar PDF del pedido
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF del pedido...');
      const pdfService = new PDFService();
      const pdfData = await pdfService.generarPDFPedido(pedido, 'agendado');
      if (pdfData) {
        pdfAttachment = {
          filename: pdfData.filename,
          content: pdfData.buffer,
          contentType: pdfData.contentType
        };
        console.log('✅ PDF generado exitosamente:', pdfData.filename);
      }
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError.message);
      // Continuar sin PDF si hay error
    }

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
        console.log('📧 Enviando con Gmail...');
        
        const mailOptions = {
          from: `"${process.env.COMPANY_NAME || 'JLA Global Company'}" <${process.env.GMAIL_USER}>`,
          to: destinatario,
          subject: asuntoFinal,
          html: htmlContent,
          attachments: pdfAttachment ? [{
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
            contentType: pdfAttachment.contentType
          }] : []
        };

        await gmailTransporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente con Gmail');
        
        // Marcar como enviado por correo si es necesario
        await Pedido.findByIdAndUpdate(pedidoId, { enviadoCorreo: true });

        return res.status(200).json({ 
          message: '¡Pedido enviado por correo exitosamente!',
          details: {
            destinatario: destinatario,
            asunto: asuntoFinal,
            proveedor: 'Gmail',
            pdfAdjunto: pdfAttachment ? true : false
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
        console.log('📧 Enviando con SendGrid...');

        const msg = {
          to: destinatario,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME || process.env.COMPANY_NAME || 'JLA Global Company'
          },
          subject: asuntoFinal,
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
        
        // Marcar como enviado por correo
        await Pedido.findByIdAndUpdate(pedidoId, { enviadoCorreo: true });

        return res.status(200).json({ 
          message: '¡Pedido enviado por correo exitosamente!',
          details: {
            destinatario: destinatario,
            asunto: asuntoFinal,
            proveedor: 'SendGrid',
            pdfAdjunto: pdfAttachment ? true : false
          }
        });

      } catch (sendgridError) {
        console.error('❌ Error con SendGrid:', sendgridError.message);
        if (sendgridError.response && sendgridError.response.body) {
          console.error('❌ Detalles SendGrid:', sendgridError.response.body);
        }
      }
    }

    // Si llegamos aquí, ningún proveedor funcionó
    console.error('❌ No se pudo enviar el correo con ningún proveedor');
    throw new Error(
      !sendgridConfigured && !gmailTransporter ? 
        'No hay proveedores de correo configurados. Configure Gmail SMTP o SendGrid.' : 
        'Todos los proveedores de correo fallaron'
    );

  } catch (error) {
    console.error('❌ Error al enviar pedido por correo:', error);
    res.status(500).json({ 
      message: 'Error al enviar pedido por correo', 
      error: error.message,
      details: 'Revise la configuración de proveedores de correo y la conectividad'
    });
  }
};

// Enviar remisi�n por correo
exports.enviarRemisionPorCorreo = async (req, res) => {
  try {
    const { correoDestino, asunto, mensaje } = req.body;
    const pedidoId = req.params.id;
    
    console.log('🔍 Iniciando envío de remisión por correo:', pedidoId);
    console.log('📧 Datos de envío:', { correoDestino, asunto });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente.correo;
    const asuntoFinal = asunto || `Remisión - Pedido ${pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    
    // Generar número de remisión si no existe
    const numeroRemision = `REM-${pedido.numeroPedido}-${Date.now().toString().slice(-6)}`;
    
    // Generar HTML profesional de la remisión
    const htmlContent = generarHTMLRemision(pedido, numeroRemision, mensaje);
    
    // Generar PDF de la remisión
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la remisión...');
      const pdfService = new PDFService();
      
      // Crear objeto remisión para el PDF
      const remisionData = {
        numeroRemision: numeroRemision,
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
        total: pedido.productos.reduce((total, p) => {
          return total + ((p.cantidad || 0) * (p.product?.price || 0));
        }, 0)
      };
      
      const pdfData = await pdfService.generarPDFRemision(remisionData);
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

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.json({ message: 'Remisión enviada por correo exitosamente' });
  } catch (error) {
    console.error('❌ Error al enviar remisión por correo:', error);
    res.status(500).json({ message: 'Error al enviar remisión por correo', error: error.message });
  }
};

// Enviar remisión formal por correo
exports.enviarRemisionFormalPorCorreo = async (req, res) => {
  try {
    const { numeroRemision, correoDestino, asunto, mensaje } = req.body;
    const pedidoId = req.params.id;
    
    console.log('🔍 Iniciando envío de remisión formal por correo:', pedidoId);
    console.log('📧 Datos de envío:', { correoDestino, asunto, numeroRemision });

    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product')
      .exec();

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const destinatario = correoDestino || pedido.cliente.correo;
    const asuntoFinal = asunto || `Remisión Formal ${numeroRemision || pedido.numeroPedido} - ${process.env.COMPANY_NAME || 'JLA Global Company'}`;
    
    // Generar número de remisión formal si no se proporciona
    const numeroRemisionFinal = numeroRemision || `RF-${pedido.numeroPedido}-${Date.now().toString().slice(-6)}`;
    
    // Generar HTML profesional de la remisión formal
    const htmlContent = generarHTMLRemision(pedido, numeroRemisionFinal, mensaje);
    
    // Generar PDF de la remisión formal
    let pdfAttachment = null;
    try {
      console.log('📄 Generando PDF de la remisión formal...');
      const pdfService = new PDFService();
      
      // Crear objeto remisión formal para el PDF
      const remisionFormalData = {
        numeroRemision: numeroRemisionFinal,
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
        observaciones: mensaje,
        total: pedido.productos.reduce((total, p) => {
          return total + ((p.cantidad || 0) * (p.product?.price || 0));
        }, 0)
      };
      
      const pdfData = await pdfService.generarPDFRemision(remisionFormalData);
      pdfAttachment = {
        filename: `remision-formal-${numeroRemisionFinal.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: pdfData.buffer,
        contentType: pdfData.contentType
      };
      console.log('✅ PDF de remisión formal generado exitosamente:', pdfAttachment.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF de remisión formal:', pdfError.message);
      // Continuar sin PDF si hay error
    }

    await enviarCorreoConAttachment(destinatario, asuntoFinal, htmlContent, pdfAttachment);

    res.json({ message: 'Remisión formal enviada por correo exitosamente' });
  } catch (error) {
    console.error('❌ Error al enviar remisión formal por correo:', error);
    res.status(500).json({ message: 'Error al enviar remisión formal por correo', error: error.message });
  }
};

// Función para probar la configuración de email
exports.testEmailConfiguration = async (req, res) => {
  try {
    console.log('🧪 Iniciando prueba de configuración de email...');
    
    const testEmail = req.body.email || 'test@example.com';
    const asunto = 'Prueba de configuración de email - Pangea';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Prueba de Configuración de Email</h2>
        <p>Este es un email de prueba para verificar la configuración del sistema.</p>
        <p><strong>Hora de prueba:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p><strong>Estado:</strong> ✅ Email enviado exitosamente</p>
      </div>
    `;

    await enviarCorreoConAttachment(testEmail, asunto, htmlContent, null);

    res.json({ 
      success: true,
      message: 'Email de prueba enviado exitosamente',
      timestamp: new Date().toISOString(),
      emailDestino: testEmail
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar email de prueba', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Función auxiliar para generar HTML de remisión con diseño profesional
function generarHTMLRemision(pedido, numeroRemision, mensaje = '') {
  // Calcular totales
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
          color: #28a745; 
          font-size: 0.9em; 
        }
        
        .total-row { 
          background: #e8f5e8 !important; 
          font-weight: bold; 
          border: 2px solid #28a745 !important; 
        }
        
        .total-row td { 
          color: #28a745; 
          font-size: 1.1em; 
        }
        
        .total-row td:before { 
          color: #28a745; 
        }
        
        /* Mobile total summary */
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
            text-align: left; 
            font-weight: 600; 
          }
          .products-table tr:hover { 
            background: #f8f9fa; 
          }
          .total-row td { 
            border-top: 3px solid #28a745; 
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
          <p>Documento de remisión No. <strong>${numeroRemision || pedido.numeroPedido}</strong></p>
          <span class="status-badge">${pedido.estado?.toUpperCase() || 'ENTREGADO'}</span>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Cliente -->
            <div class="info-card">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
              <p><strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${pedido.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> ${pedido.cliente?.ciudad || 'N/A'}</p>
            </div>

            <!-- Detalles de la Remisión -->
            <div class="info-card">
              <h3>📋 Detalles de la Remisión</h3>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Pedido Original:</strong> ${pedido.numeroPedido}</p>
              <p><strong>Estado:</strong> ${pedido.estado || 'entregado'}</p>
              <p><strong>Responsable:</strong> Sistema</p>
              <p><strong>Items:</strong> ${pedido.productos?.length || 0} productos</p>
              <p><strong>Cantidad Total:</strong> ${cantidadTotal} unidades</p>
            </div>
          </div>

          <!-- Products Section -->
          <div class="products-section">
            <h2 class="products-title">📦 Productos Entregados</h2>
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
                ${pedido.productos.map((producto, index) => {
                  const precio = Number(producto.product?.price) || 0;
                  const cantidad = Number(producto.cantidad) || 0;
                  const total = precio * cantidad;
                  return `
                  <tr>
                    <td data-label="Producto:">
                      <strong>${producto.product?.name || producto.product?.nombre || 'Producto sin nombre'}</strong>
                      ${producto.product?.codigo ? '<br><small style="color: #666;">Código: ' + producto.product.codigo + '</small>' : ''}
                    </td>
                    <td data-label="Cantidad:" style="text-align: center; font-weight: bold;">${cantidad}</td>
                    <td data-label="Precio Unit.:" style="text-align: right;">$${precio.toLocaleString('es-ES')}</td>
                    <td data-label="Total:" style="text-align: right; font-weight: bold;">$${total.toLocaleString('es-ES')}</td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="TOTAL:" colspan="3" style="text-align: right; font-size: 1.2em;">💰 <strong>TOTAL GENERAL:</strong></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>$${totalCalculado.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Mobile Total Summary -->
            <div class="mobile-total">
              💰 Total General: $${totalCalculado.toLocaleString('es-ES')}
            </div>
          </div>

          <!-- Message Section -->
          ${mensaje ? `
          <div class="message-section">
            <h3>💬 Mensaje</h3>
            <p>${mensaje}</p>
          </div>
          ` : `
          <div class="message-section">
            <h3>✅ Confirmación de Entrega</h3>
            <p>Estimado/a ${pedido.cliente?.nombre || 'Cliente'}, nos complace confirmar que su pedido ${pedido.numeroPedido} ha sido procesado y entregado exitosamente. Agradecemos su confianza en nuestros servicios y esperamos seguir siendo su proveedor de confianza.</p>
          </div>
          `}

          ${pedido.observaciones ? `
          <!-- Observaciones -->
          <div class="info-card" style="margin-top: 20px;">
            <h3>📝 Observaciones</h3>
            <p>${pedido.observaciones}</p>
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

// Función para generar HTML profesional de pedidos agendados
function generarHTMLPedidoAgendado(pedido, mensaje = '') {
  // Calcular totales
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
        
        /* Mobile total summary */
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
        
        /* Desktop styles */
        @media (min-width: 768px) { 
          body { 
            padding: 20px; 
          }
          .header h1 { 
            font-size: 2.5em; 
          }
          .header p { 
            font-size: 1.2em; 
          }
          .container { 
            margin: 20px auto; 
          }
          .content { 
            padding: 30px; 
          }
          .info-grid { 
            display: block; 
            margin-bottom: 30px; 
          }
          .info-card { 
            padding: 20px; 
            margin-bottom: 20px; 
          }
          .info-card h3 { 
            font-size: 1.3em; 
          }
          .info-card p { 
            font-size: 1em; 
          }
          .products-title { 
            padding: 20px; 
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
            margin: 0; 
            padding: 0; 
            background: transparent; 
          }
          .products-table th, 
          .products-table td { 
            display: table-cell; 
            padding: 12px; 
            border-bottom: 1px solid #eee; 
            text-align: left; 
            position: static; 
          }
          .products-table th { 
            background: #fd7e14; 
            color: white; 
            font-weight: bold; 
            text-align: center; 
          }
          .products-table td { 
            padding-left: 12px; 
          }
          .products-table td:before { 
            display: none; 
          }
          .products-table td:nth-child(2), 
          .products-table td:nth-child(3), 
          .products-table td:nth-child(4) { 
            text-align: center; 
          }
          .products-table .total-row { 
            background: #fff3e0 !important; 
            border-top: 3px solid #fd7e14; 
            font-size: 1.1em; 
          }
          .alert-section { 
            padding: 25px; 
          }
          .alert-section h3 { 
            font-size: 1.3em; 
          }
          .alert-section p { 
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
          <h1>📅 PEDIDO AGENDADO</h1>
          <p>Confirmación de pedido No. <strong>${pedido.numeroPedido}</strong></p>
          <span class="status-badge">${pedido.estado?.toUpperCase() || 'AGENDADO'}</span>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Cliente -->
            <div class="info-card">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${pedido.cliente?.nombre || 'N/A'}</p>
              <p><strong>Correo:</strong> ${pedido.cliente?.correo || 'N/A'}</p>
              <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono || 'N/A'}</p>
              <p><strong>Dirección:</strong> ${pedido.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> ${pedido.cliente?.ciudad || 'N/A'}</p>
            </div>

            <!-- Información del Pedido -->
            <div class="info-card">
              <h3>📋 Detalles del Pedido</h3>
              <p><strong>Número de Pedido:</strong> ${pedido.numeroPedido}</p>
              <p><strong>Fecha de Entrega:</strong> ${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> <span style="color: #fd7e14; font-weight: bold;">${(pedido.estado?.toUpperCase()) || 'AGENDADO'}</span></p>
              <p><strong>Cantidad Total de Productos:</strong> ${cantidadTotal} unidades</p>
              ${pedido.cotizacionCodigo ? '<p><strong>Cotización de Referencia:</strong> ' + pedido.cotizacionCodigo + '</p>' : ''}
            </div>
          </div>

          <!-- Alert Section para pedidos agendados -->
          <div class="alert-section">
            <h3>⏰ Información Importante</h3>
            <p>Su pedido ha sido <strong>agendado</strong> para entrega el <strong>${new Date(pedido.fechaEntrega).toLocaleDateString('es-ES')}</strong>. Nos estaremos comunicando con usted próximamente para coordinar los detalles de la entrega. Por favor mantenga este número de pedido como referencia: <strong>${pedido.numeroPedido}</strong>.</p>
          </div>

          <!-- Products Section -->
          <div class="products-section">
            <div class="products-title">
              🛒 Productos Incluidos (${cantidadTotal} unidades)
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
                      <td data-label="Precio Unit.:">S/. ${precio.toLocaleString('es-ES')}</td>
                      <td data-label="Subtotal:">S/. ${subtotal.toLocaleString('es-ES')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td data-label="" style="text-align: left; font-weight: bold;">TOTAL GENERAL</td>
                  <td data-label="">${cantidadTotal}</td>
                  <td data-label=""></td>
                  <td data-label="" style="text-align: right; font-size: 1.3em;"><strong>S/. ${totalCalculado.toLocaleString('es-ES')}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Mobile Total Summary -->
            <div class="mobile-total">
              💰 Total General: S/. ${totalCalculado.toLocaleString('es-ES')}
            </div>
          </div>

          <!-- Message Section -->
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

