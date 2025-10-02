const Compra = require('../models/compras');

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

    const nuevaCompra = await Compra.create(req.body);
    res.status(201).json({ success: true, data: nuevaCompra });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};




// Obtener historial de compras por proveedor
const obtenerComprasPorProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const compras = await Compra.find({ proveedor: id })
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
    const compra = await Compra.findByIdAndDelete(req.params.id);
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

    const compraActualizada = await Compra.findByIdAndUpdate(
      id,
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





module.exports = {
  crearCompra,
  obtenerComprasPorProveedor,
  obtenerTodasLasCompras,
  eliminarCompra,
  actualizarCompra
};