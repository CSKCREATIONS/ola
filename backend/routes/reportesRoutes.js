const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { checkPermission } = require('../middlewares/role');
const { verifyToken } = require('../middlewares/authJwt');

// ========== RUTAS SIN AUTENTICACIÓN PARA REPORTES BÁSICOS ==========
// Estas rutas deben ir ANTES que las rutas con autenticación

// Estadísticas básicas de productos
router.get('/estadisticas-productos', reportesController.estadisticasProductos);
router.get('/productos-por-categoria', reportesController.productosPorCategoria);
router.get('/productos-por-estado', reportesController.productosPorEstado);

// Estadísticas básicas de proveedores
router.get('/estadisticas-proveedores', reportesController.estadisticasProveedores);
router.get('/proveedores-por-pais', reportesController.proveedoresPorPais);
router.get('/proveedores-por-estado', reportesController.proveedoresPorEstado);
router.get('/productos-por-proveedor', reportesController.productosPorProveedor);
router.get('/proveedores-recientes', reportesController.proveedoresRecientes);

// ========== RUTAS CON AUTENTICACIÓN (LEGACY) ==========


// Reportes productos
router.get(
    '/categorias',
    verifyToken,
    checkPermission('reportesProductos.ver'),
    reportesController.reporteCategorias
);


router.get('/productos',
    verifyToken,
    checkPermission('reportesProductos.ver'),
    reportesController.reporteProductos
);
router.get('/consolidado',
    verifyToken,
    checkPermission('reportesProductos.ver'),
    reportesController.reporteConsolidado
);



router.get('/estadisticas-productos',
    reportesController.estadisticasProductos
);

router.get('/productos-por-categoria',
    reportesController.productosPorCategoria
);

router.get('/productos-por-estado',
    reportesController.productosPorEstado
);

router.get('/estadisticas-proveedores',
    reportesController.estadisticasProveedores
);

router.get('/proveedores-por-pais',
    reportesController.proveedoresPorPais
);

router.get('/proveedores-por-estado',
    reportesController.proveedoresPorEstado
);

router.get('/productos-por-proveedor',
    reportesController.productosPorProveedor
);

router.get('/proveedores-recientes',
    reportesController.proveedoresRecientes
);

// Productos reales por proveedor (para detalle) - sin autenticación para QA
router.get('/productos-de-proveedor/:id',
    reportesController.productosDeProveedor
);

router.get('/productos',
    reportesController.productos
);

// ========== NUEVAS RUTAS PARA REPORTES DE VENTAS ==========
// Top clientes con más compras
router.get('/top-clientes-compras', reportesController.topClientesCompras);

// Top productos más vendidos (con filtro de tiempo)
router.get('/top-productos-vendidos', reportesController.topProductosVendidos);

// Cotizaciones registradas (con filtro de tiempo)
router.get('/cotizaciones-registradas', reportesController.reporteCotizacionesRegistradas);

// Pedidos agendados y cancelados (con filtro de tiempo)
router.get('/pedidos-estados', reportesController.reportePedidosEstados);

// Prospectos convertidos en clientes (con filtro de tiempo)
router.get('/prospectos-convertidos', reportesController.reporteProspectosConvertidos);

// Remisiones generadas (con filtro de tiempo)
router.get('/remisiones-generadas', reportesController.reporteRemisionesGeneradas);

// Estadísticas generales para dashboard
router.get('/estadisticas', reportesController.estadisticas);

// Estados de pedidos para gráfico
router.get('/estados', reportesController.estados);

// Reportes de proveedores
router.get('/por-pais',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteProveedoresPorPais
);

router.get('/por-estado',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteEstadoProveedores
);
router.get('/por-productos',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteProductosPorProveedor
);
router.get('/recientes',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteProveedoresRecientes
);

// ===== Reportes de Compras =====
router.get('/compras/por-periodo',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteComprasPorPeriodo
);

router.get('/compras/consolidado',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteComprasConsolidado
);

router.get('/compras/por-producto',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteComprasPorProducto
);

router.get('/compras/por-proveedor',
    verifyToken,
    checkPermission('reportesCompras.ver'),
    reportesController.reporteComprasPorProveedor
);

module.exports = router;