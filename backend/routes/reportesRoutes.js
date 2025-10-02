const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { checkPermission } = require('../middlewares/role');
const { verifyToken } = require('../middlewares/authJwt');


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