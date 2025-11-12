const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { checkPermission } = require('../middlewares/role');
const { verifyToken } = require('../middlewares/authJwt');

// ========== RUTAS SIN AUTENTICACIÓN PARA REPORTES BÁSICOS ==========
// Estas rutas deben ir ANTES que las rutas con autenticación

// Estadísticas básicas de ventas
router.get('/estados', reportesController.estadosPedidos);
router.get('/clientes', reportesController.clientes);
router.get('/productos', reportesController.productos);

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

router.get('/subcategorias',
    verifyToken,
    checkPermission('reportesProductos.ver'),
    reportesController.reporteSubcategorias
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

// Reportes de ventas
router.get('/ventas/por-periodo',
    verifyToken,
    checkPermission('reportesVentas.ver'),
    reportesController.reporteVentasPorPeriodo
);
router.get('/ventas/consolidado',
    verifyToken,
    checkPermission('reportesVentas.ver'),
    reportesController.reporteVentasConsolidado
);
router.get('/ventas/por-estado',
    verifyToken,
    checkPermission('reportesVentas.ver'),
    reportesController.reportePedidosPorEstado
);
router.get('/ventas/cotizaciones',
    verifyToken,
    checkPermission('reportesVentas.ver'),
    reportesController.reporteCotizaciones
);

// 🆕 Reporte de clientes
router.get('/clientes',
    verifyToken,
    checkPermission('reportesVentas.ver'),
    reportesController.reporteClientes);

// Nuevas rutas para reportes simplificados (SIN AUTENTICACIÓN PARA TESTING)
router.get('/estadisticas',
    reportesController.estadisticasVentas
);

router.get('/estados',
    reportesController.estadosPedidos
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

router.get('/clientes',
    reportesController.clientes
);

router.get('/productos',
    reportesController.productos
);


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

module.exports = router;