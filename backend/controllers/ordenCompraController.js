// controllers/ordenCompraController.js
const OrdenCompra = require('../models/ordenCompra');
const Compra = require('../models/compras'); // Asegúrate de que la ruta es correcta
const Producto = require('../models/Products'); // Importar modelo de productos


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

module.exports = {
  crearOrden,
  listarOrdenes,
  obtenerOrden,
  eliminarOrden,
  completarOrden,
  editarOrden
};
