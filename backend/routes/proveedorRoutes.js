const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const proveedorController = require('../controllers/proveedorControllers');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');

// Validaciones para crear o editar proveedor
const validateProveedor = [
    check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('correo').isEmail().withMessage('Debe proporcionar un correo válido'),
    check('telefono').not().isEmpty().withMessage('El teléfono es obligatorio'),
    check('direccion').not().isEmpty().withMessage('La dirección es obligatoria'),
    check('empresa').not().isEmpty().withMessage('La empresa es obligatoria'), // ⚠️ Si este falla, lanza 400
];


/*** RUTAS ***/

// POST /api/proveedores - Crear proveedor 
router.post('/',
    verifyToken,
    validateProveedor,
    checkPermission('proveedores.crear'),
    proveedorController.createProveedor
);

// GET /api/proveedores - Listar proveedores
router.get('/',
    verifyToken,
    checkPermission('proveedores.ver'),
    proveedorController.getProveedores
);

// routes/proveedorRoutes.js
router.get('/activos',
    verifyToken,
    checkPermission('proveedores.ver'),
    proveedorController.getProveedoresActivos
);

// GET /api/proveedores/:id - Obtener uno por ID
router.get('/:id',
    verifyToken,
    checkPermission('proveedores.ver'),
    proveedorController.getProveedorById
);

// PUT /api/proveedores/:id - Actualizar proveedor
router.put('/:id',
    verifyToken,
    validateProveedor,
    checkPermission('proveedores.editar'),
    proveedorController.updateProveedor
);

// PATCH /api/proveedores/:id/deactivate - Desactivar proveedor
router.patch('/:id/deactivate',
    verifyToken,
    checkPermission('proveedores.inactivar'),
    proveedorController.deactivateProveedor
);

// PATCH /api/proveedores/:id/activate - Activar proveedor

router.patch('/:id/activate',
    verifyToken,
    checkPermission('proveedores.activar'),
    proveedorController.activateProveedor
);



module.exports = router;