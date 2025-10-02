const Venta = require('../models/venta');
const Product = require('../models/Products'); // asegúrate de importar el modelo

exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find().populate('cliente').populate('productos.producto');
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error });
  }
};

exports.obtenerVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id)
      .populate('cliente')
      .populate('productos.producto');

    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.status(200).json(venta);
  } catch (error) {
    console.error('Error al obtener la venta por ID:', error);
    res.status(500).json({ message: 'Error al obtener la venta', error });
  }
};


exports.eliminarVenta = async (req, res) => {
  try {
    await Venta.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ message: 'Error al eliminar venta', error });
  }
};


exports.crearVenta = async (req, res) => {
  try {
    const { cliente, productos } = req.body;

    // Verificar y calcular total
    let total = 0;
    const productosProcesados = await Promise.all(productos.map(async (p) => {
      const productoDB = await Product.findById(p.producto);
      if (!productoDB) throw new Error('Producto no encontrado');

      const subtotal = productoDB.price * p.cantidad;
      total += subtotal;

      return {
        producto: p.producto,
        cantidad: p.cantidad,
        precioUnitario: productoDB.price
      };
    }));

    const nuevaVenta = new Venta({
      cliente,
      productos: productosProcesados,
      total
    });

    await nuevaVenta.save();

    res.status(201).json({ message: 'Venta registrada correctamente', venta: nuevaVenta });

  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ message: 'Error al registrar la venta', error });
  }
};

