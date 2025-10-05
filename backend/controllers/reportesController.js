const Category = require('../models/category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Products');
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const Venta = require('../models/venta');
const Proveedor = require('../models/proveedores');

// Reporte de categorías con estadísticas
exports.reporteCategorias = async (req, res) => {
  try {
    const categorias = await Category.aggregate([
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subcategorias'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          activo: 1,
          createdAt: 1,
          totalSubcategorias: { $size: '$subcategorias' }
        }
      }
    ]);

    res.status(200).json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reporte de subcategorías con productos
exports.reporteSubcategorias = async (req, res) => {
  try {
    const subcategorias = await Subcategory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'subcategory',
          as: 'productos'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          activo: 1,
          category: 1,
          totalProductos: { $size: '$productos' },
          productosBajoStock: {
            $size: {
              $filter: {
                input: '$productos',
                as: 'prod',
                cond: { $lt: ['$$prod.stock', 10] } // Stock < 10
              }
            }
          }
        }
      }
    ]).exec();

    res.status(200).json({ success: true, data: subcategorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reporte de productos avanzado
exports.reporteProductos = async (req, res) => {
  try {
    const { minStock, maxPrice, categoria } = req.query;
    const filters = {};

    if (minStock) filters.stock = { $gte: parseInt(minStock) };
    if (maxPrice) filters.price = { $lte: parseFloat(maxPrice) };
    if (categoria) filters.category = categoria;

    const productos = await Product.find(filters)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('proveedor', 'nombre empresa');

    res.status(200).json({ success: true, count: productos.length, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reporteConsolidado = async (req, res) => {
  try {
    // Total de productos
    const totalProductos = await Product.countDocuments();

    // Productos con bajo stock (<10)
    const productosBajoStock = await Product.countDocuments({ stock: { $lt: 10 } });

    // Productos por estado (activo/inactivo)
    const productosPorEstado = await Product.aggregate([
      {
        $group: {
          _id: '$activo',
          count: { $sum: 1 }
        }
      }
    ]);

    // Productos por categoría
    const productosPorCategoria = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'productos'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          activo: 1,
          createdAt: 1,
          totalProductos: { $size: '$productos' },
          productosActivos: {
            $size: {
              $filter: {
                input: '$productos',
                as: 'prod',
                cond: { $eq: ['$$prod.activo', true] }
              }
            }
          }
        }
      },
      { $sort: { totalProductos: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProductos,
        productosBajoStock,
        productosPorEstado,
        productosPorCategoria
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


//ventas



exports.reporteVentasPorPeriodo = async (req, res) => {
  try {
    // Puedes recibir opcionalmente un rango de fechas desde el frontend
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde && hasta) {
      filtroFecha.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta)
      };
    }

    // Obtener ventas tradicionales
    const ventasTradicionales = await Venta.aggregate([
      { $match: filtroFecha },
      {
        $group: {
          _id: {
            año: { $year: '$fecha' },
            mes: { $month: '$fecha' },
            dia: { $dayOfMonth: '$fecha' }
          },
          totalVentas: { $sum: 1 },
          totalIngresos: { $sum: '$total' }
        }
      },
      {
        $addFields: {
          tipo: 'venta'
        }
      }
    ]);

    // Filtro para pedidos entregados
    const filtroPedidos = { estado: 'entregado' };
    if (desde && hasta) {
      filtroPedidos.updatedAt = {
        $gte: new Date(desde),
        $lte: new Date(hasta)
      };
    }

    // Obtener pedidos entregados como ventas
    const pedidosEntregados = await Pedido.aggregate([
      { $match: filtroPedidos },
      {
        $lookup: {
          from: 'cotizacions', // Nombre de la colección de cotizaciones
          localField: 'cotizacionReferenciada',
          foreignField: '_id',
          as: 'cotizacion'
        }
      },
      {
        $unwind: {
          path: '$cotizacion',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            año: { $year: '$updatedAt' },
            mes: { $month: '$updatedAt' },
            dia: { $dayOfMonth: '$updatedAt' }
          },
          totalVentas: { $sum: 1 },
          totalIngresos: { 
            $sum: { 
              $ifNull: ['$cotizacion.total', 0] 
            }
          }
        }
      },
      {
        $addFields: {
          tipo: 'pedido_entregado'
        }
      }
    ]);

    // Combinar ventas tradicionales y pedidos entregados
    const todasLasVentas = [...ventasTradicionales, ...pedidosEntregados];

    // Agrupar por fecha sumando totales
    const ventasAgrupadas = {};
    todasLasVentas.forEach(venta => {
      const key = `${venta._id.año}-${venta._id.mes}-${venta._id.dia}`;
      if (!ventasAgrupadas[key]) {
        ventasAgrupadas[key] = {
          _id: venta._id,
          totalVentas: 0,
          totalIngresos: 0,
          desglose: {
            ventasTradicionales: 0,
            pedidosEntregados: 0,
            ingresosVentas: 0,
            ingresosPedidos: 0
          }
        };
      }
      
      ventasAgrupadas[key].totalVentas += venta.totalVentas;
      ventasAgrupadas[key].totalIngresos += venta.totalIngresos;
      
      if (venta.tipo === 'venta') {
        ventasAgrupadas[key].desglose.ventasTradicionales += venta.totalVentas;
        ventasAgrupadas[key].desglose.ingresosVentas += venta.totalIngresos;
      } else {
        ventasAgrupadas[key].desglose.pedidosEntregados += venta.totalVentas;
        ventasAgrupadas[key].desglose.ingresosPedidos += venta.totalIngresos;
      }
    });

    // Convertir a array y ordenar
    const ventasFinales = Object.values(ventasAgrupadas).sort((a, b) => {
      if (a._id.año !== b._id.año) return a._id.año - b._id.año;
      if (a._id.mes !== b._id.mes) return a._id.mes - b._id.mes;
      return a._id.dia - b._id.dia;
    });

    res.json({
      success: true,
      data: ventasFinales,
      resumen: {
        totalVentasTradicionalesCount: ventasTradicionales.reduce((sum, v) => sum + v.totalVentas, 0),
        totalPedidosEntregadosCount: pedidosEntregados.reduce((sum, v) => sum + v.totalVentas, 0),
        totalIngresosVentas: ventasTradicionales.reduce((sum, v) => sum + v.totalIngresos, 0),
        totalIngresosPedidos: pedidosEntregados.reduce((sum, v) => sum + v.totalIngresos, 0)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el reporte de ventas por periodo' });
  }
};

// Nuevo reporte consolidado de ventas (incluye pedidos entregados)
exports.reporteVentasConsolidado = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    // Filtros de fecha
    const filtroVentas = {};
    const filtroPedidos = { estado: 'entregado' };
    
    if (desde && hasta) {
      filtroVentas.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta)
      };
      filtroPedidos.updatedAt = {
        $gte: new Date(desde),
        $lte: new Date(hasta)
      };
    }

    // Estadísticas de ventas tradicionales
    const estadisticasVentas = await Venta.aggregate([
      { $match: filtroVentas },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: 1 },
          totalIngresos: { $sum: '$total' },
          promedioVenta: { $avg: '$total' }
        }
      }
    ]);

    // Estadísticas de pedidos entregados
    const estadisticasPedidos = await Pedido.aggregate([
      { $match: filtroPedidos },
      {
        $lookup: {
          from: 'cotizacions',
          localField: 'cotizacionReferenciada',
          foreignField: '_id',
          as: 'cotizacion'
        }
      },
      {
        $unwind: {
          path: '$cotizacion',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          totalPedidosEntregados: { $sum: 1 },
          totalIngresosPedidos: { 
            $sum: { 
              $ifNull: ['$cotizacion.total', 0] 
            }
          },
          promedioPedido: { 
            $avg: { 
              $ifNull: ['$cotizacion.total', 0] 
            }
          }
        }
      }
    ]);

    // Top productos más vendidos (de ventas tradicionales)
    const topProductosVentas = await Venta.aggregate([
      { $match: filtroVentas },
      { $unwind: '$productos' },
      {
        $group: {
          _id: '$productos.product',
          cantidadVendida: { $sum: '$productos.cantidad' },
          ingresosTotales: { $sum: { $multiply: ['$productos.cantidad', '$productos.precioUnitario'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'producto'
        }
      },
      { $unwind: '$producto' },
      {
        $project: {
          nombreProducto: '$producto.name',
          cantidadVendida: 1,
          ingresosTotales: 1
        }
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: 5 }
    ]);

    // Top productos más entregados (de pedidos)
    const topProductosPedidos = await Pedido.aggregate([
      { $match: filtroPedidos },
      { $unwind: '$productos' },
      {
        $group: {
          _id: '$productos.product',
          cantidadEntregada: { $sum: '$productos.cantidad' },
          ingresosEstimados: { $sum: { $multiply: ['$productos.cantidad', '$productos.precioUnitario'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'producto'
        }
      },
      { $unwind: '$producto' },
      {
        $project: {
          nombreProducto: '$producto.name',
          cantidadEntregada: 1,
          ingresosEstimados: 1
        }
      },
      { $sort: { cantidadEntregada: -1 } },
      { $limit: 5 }
    ]);

    const ventasData = estadisticasVentas[0] || { totalVentas: 0, totalIngresos: 0, promedioVenta: 0 };
    const pedidosData = estadisticasPedidos[0] || { totalPedidosEntregados: 0, totalIngresosPedidos: 0, promedioPedido: 0 };

    res.json({
      success: true,
      data: {
        resumen: {
          totalTransacciones: ventasData.totalVentas + pedidosData.totalPedidosEntregados,
          totalIngresos: ventasData.totalIngresos + pedidosData.totalIngresosPedidos,
          ventasTradicionales: {
            cantidad: ventasData.totalVentas,
            ingresos: ventasData.totalIngresos,
            promedio: ventasData.promedioVenta
          },
          pedidosEntregados: {
            cantidad: pedidosData.totalPedidosEntregados,
            ingresos: pedidosData.totalIngresosPedidos,
            promedio: pedidosData.promedioPedido
          }
        },
        topProductos: {
          masVendidos: topProductosVentas,
          masEntregados: topProductosPedidos
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el reporte consolidado de ventas' });
  }
};




exports.reportePedidosPorEstado = async (req, res) => {
  try {
    const resultado = await Pedido.aggregate([
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      },
      {
        $project: {
          estado: '$_id',
          cantidad: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el reporte de pedidos por estado' });
  }
};


exports.reporteCotizaciones = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtro = {};

    // Validar que las fechas existan y sean válidas
    if (desde && hasta && !isNaN(new Date(desde)) && !isNaN(new Date(hasta))) {
      filtro.fecha = {
        $gte: new Date(desde),
        $lte: new Date(hasta)
      };
    }

    const total = await Cotizacion.countDocuments(filtro);

    const enviadas = await Cotizacion.countDocuments({
      ...filtro,
      enviadoCorreo: true
    });

    const noEnviadas = total - enviadas;

    res.json({
      success: true,
      data: {
        total,
        enviadas,
        noEnviadas
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el reporte de cotizaciones' });
  }
};



// controllers/reportesController.js

exports.reporteClientes = async (req, res) => {
  try {
    const total = await Cliente.countDocuments();
    const activos = await Cliente.countDocuments({ activo: true });
    const inactivos = total - activos;

    // Clientes con más compras (ordenado por totalCompras)
    const topClientes = await Cliente.find({ totalCompras: { $gt: 0 } })
      .sort({ totalCompras: -1 })
      .limit(5)
      .select('nombre email totalCompras activo');

    res.json({
      success: true,
      data: {
        total,
        activos,
        inactivos,
        topClientes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar el reporte de clientes' });
  }
};


////// prov y com

// Proveedores por país


exports.reporteProveedoresPorPais = async (req, res) => {
  try {
    const resultado = await Proveedor.aggregate([
      { $group: { _id: '$direccion.pais', cantidad: { $sum: 1 } } },
      { $project: { pais: '$_id', cantidad: 1, _id: 0 } },
      { $sort: { cantidad: -1 } }
    ]);
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error reporteProveedoresPorPais:', error);
    res.status(500).json({ success: false, message: 'Error al obtener reporte' });
  }
};


// Productos por proveedor
exports.reporteProductosPorProveedor = async (req, res) => {
  try {
    const resultado = await Proveedor.aggregate([
      {
        $project: {
          nombre: 1,
          empresa: 1,
          totalProductos: { $size: { $ifNull: ['$productos', []] } }
        }
      },
      { $sort: { totalProductos: -1 } }
    ]);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos por proveedor' });
  }
};


// Estado (activos/inactivos)
exports.reporteEstadoProveedores = async (req, res) => {
  try {
    const resultado = await Proveedor.aggregate([
      {
        $group: {
          _id: '$activo',
          cantidad: { $sum: 1 }
        }
      }
    ]);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al agrupar por estado' });
  }
};

// Proveedores recientes
exports.reporteProveedoresRecientes = async (req, res) => {
  try {
    const resultado = await Proveedor.find()
      .sort({ fechaCreacion: -1 })
      .limit(5);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener proveedores recientes' });
  }
};

// ===== NUEVOS CONTROLADORES PARA REPORTES SIMPLIFICADOS =====

// Estadísticas de Ventas
exports.estadisticasVentas = async (req, res) => {
  try {
    const totalVentas = await Venta.countDocuments();
    const totalPedidos = await Pedido.countDocuments();
    const clientesActivos = await Cliente.countDocuments({ activo: true });
    
    const ventasConPrecio = await Venta.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    
    const ventasTotales = ventasConPrecio.length > 0 ? ventasConPrecio[0].total : 0;
    
    const ventasMensuales = await Venta.aggregate([
      {
        $group: {
          _id: { $month: "$fecha" },
          ventas: { $sum: 1 },
          ingresos: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          mes: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Enero" },
                { case: { $eq: ["$_id", 2] }, then: "Febrero" },
                { case: { $eq: ["$_id", 3] }, then: "Marzo" },
                { case: { $eq: ["$_id", 4] }, then: "Abril" },
                { case: { $eq: ["$_id", 5] }, then: "Mayo" },
                { case: { $eq: ["$_id", 6] }, then: "Junio" },
                { case: { $eq: ["$_id", 7] }, then: "Julio" },
                { case: { $eq: ["$_id", 8] }, then: "Agosto" },
                { case: { $eq: ["$_id", 9] }, then: "Septiembre" },
                { case: { $eq: ["$_id", 10] }, then: "Octubre" },
                { case: { $eq: ["$_id", 11] }, then: "Noviembre" },
                { case: { $eq: ["$_id", 12] }, then: "Diciembre" }
              ],
              default: "Desconocido"
            }
          },
          ventas: 1,
          ingresos: 1
        }
      }
    ]);

    const response = {
      ventasTotales,
      totalPedidos,
      clientesActivos,
      crecimiento: 5.2, // Puedes calcular esto basado en datos históricos
      ventasMensuales
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas de ventas', error: error.message });
  }
};

// Estados de Pedidos
exports.estadosPedidos = async (req, res) => {
  try {
    const estados = await Pedido.aggregate([
      {
        $group: {
          _id: "$estado",
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          value: 1,
          _id: 0
        }
      }
    ]);

    res.json({ success: true, data: estados });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estados de pedidos' });
  }
};

// Estadísticas de Productos
exports.estadisticasProductos = async (req, res) => {
  try {
    const totalProductos = await Product.countDocuments();
    const productosActivos = await Product.countDocuments({ activo: true });
    const productosInactivos = await Product.countDocuments({ activo: false });
    const stockBajo = await Product.countDocuments({ stock: { $lt: 10 } });

    res.json({
      success: true,
      data: {
        totalProductos,
        productosActivos,
        productosInactivos,
        stockBajo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas de productos', error: error.message });
  }
};

// Productos por Categoría
exports.productosPorCategoria = async (req, res) => {
  try {
    const productos = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoriaInfo'
        }
      },
      {
        $unwind: '$categoriaInfo'
      },
      {
        $group: {
          _id: '$categoriaInfo._id',
          categoria: { $first: '$categoriaInfo.name' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);

    res.json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos por categoría' });
  }
};

// Productos por Estado
exports.productosPorEstado = async (req, res) => {
  try {
    const estados = await Product.aggregate([
      {
        $group: {
          _id: "$activo",
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: { $cond: { if: "$_id", then: "Activos", else: "Inactivos" } },
          value: 1,
          _id: 0
        }
      }
    ]);

    res.json({ success: true, data: estados });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos por estado' });
  }
};

// Estadísticas de Proveedores
exports.estadisticasProveedores = async (req, res) => {
  try {
    const totalProveedores = await Proveedor.countDocuments();
    const proveedoresActivos = await Proveedor.countDocuments({ activo: true });
    const proveedoresInactivos = await Proveedor.countDocuments({ activo: false });
    
    const conProductos = await Product.distinct('proveedor').then(ids => ids.length);

    res.json({
      success: true,
      data: {
        totalProveedores,
        proveedoresActivos,
        proveedoresInactivos,
        conProductos
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas de proveedores' });
  }
};

// Proveedores por País
exports.proveedoresPorPais = async (req, res) => {
  try {
    const paises = await Proveedor.aggregate([
      {
        $group: {
          _id: "$direccion.pais", // Corregido: usar direccion.pais
          cantidad: { $sum: 1 }
        }
      },
      {
        $project: {
          pais: { $ifNull: ["$_id", "Sin País"] }, // Si es null, mostrar "Sin País"
          cantidad: 1,
          _id: 0
        }
      },
      { $sort: { cantidad: -1 } }
    ]);

    res.json({ success: true, data: paises });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener proveedores por país', error: error.message });
  }
};

// Proveedores por Estado
exports.proveedoresPorEstado = async (req, res) => {
  try {
    const estados = await Proveedor.aggregate([
      {
        $group: {
          _id: "$activo",
          cantidad: { $sum: 1 }
        }
      },
      {
        $project: {
          estado: { $cond: { if: "$_id", then: "Activos", else: "Inactivos" } },
          cantidad: 1,
          _id: 0
        }
      }
    ]);

    res.json({ success: true, data: estados });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener proveedores por estado' });
  }
};

// Productos por Proveedor
exports.productosPorProveedor = async (req, res) => {
  try {
    const productos = await Product.aggregate([
      {
        $lookup: {
          from: 'proveedors',
          localField: 'proveedor',
          foreignField: '_id',
          as: 'proveedorInfo'
        }
      },
      {
        $unwind: '$proveedorInfo'
      },
      {
        $group: {
          _id: '$proveedorInfo._id',
          nombre: { $first: '$proveedorInfo.nombre' },
          empresa: { $first: '$proveedorInfo.empresa' },
          totalProductos: { $sum: 1 }
        }
      },
      { $sort: { totalProductos: -1 } },
      { $limit: 10 }
    ]);

    res.json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos por proveedor' });
  }
};

// Proveedores Recientes (nueva versión)
exports.proveedoresRecientes = async (req, res) => {
  try {
    const proveedores = await Proveedor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('nombre empresa activo createdAt');

    res.json({ success: true, data: proveedores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener proveedores recientes' });
  }
};

// Clientes para reporte de ventas
exports.clientes = async (req, res) => {
  try {
    const topClientes = await Cliente.aggregate([
      {
        $lookup: {
          from: 'pedidos',
          localField: '_id',
          foreignField: 'cliente',
          as: 'pedidos'
        }
      },
      {
        $project: {
          nombre: 1,
          email: 1,
          totalCompras: { $size: '$pedidos' }
        }
      },
      { $sort: { totalCompras: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: { topClientes } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener clientes' });
  }
};

// Productos para reporte de ventas
exports.productos = async (req, res) => {
  try {
    const topProductos = await Product.aggregate([
      {
        $lookup: {
          from: 'ventas',
          localField: '_id',
          foreignField: 'productos.producto',
          as: 'ventas'
        }
      },
      {
        $project: {
          nombre: 1,
          cantidadVendida: { $size: '$ventas' }
        }
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: { topProductos } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};






