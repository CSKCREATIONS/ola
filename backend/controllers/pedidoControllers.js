// controllers/pedidoController.js
const Pedido = require('../models/Pedido');
const Venta = require('../models/venta'); // Asegúrate de tener el modelo importado
const Product = require('../models/Products'); // para calcular precios
const Cotizacion = require('../models/cotizaciones');
const Counter = require('../models/Counter');
const Cliente = require('../models/Cliente');
const Remision = require('../models/Remision');
const mongoose = require('mongoose');




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

    const numeroPedido = `PED-${String(counter.seq).padStart(4, '0')}`;

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
        const numeroPedido2 = `PED-${String(counter2.seq).padStart(4, '0')}`;
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

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    pedido.estado = estado;
    await pedido.save();

    res.json({ message: 'Estado del pedido actualizado', pedido });
  } catch (err) {
    console.error('Error al cambiar el estado del pedido:', err);
    res.status(500).json({ message: 'Error interno al cambiar estado del pedido' });
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
      responsable: pedido.responsable || req.user?.id,
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

