const express = require('express');
const productController = require('../controllers/productControllers');
const router = express.Router();
const { check } = require('express-validator');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');


const validateProduct = [
    check('name').not().isEmpty().withMessage('el nombre es obligatorio'),
    check('description').not().isEmpty().withMessage('la descripcion es obligatorio'),
    check('price').isFloat({ min: 0 }).isEmpty().withMessage('el precio es obligatorio'),
    check('stock').isInt({ min: 0 }).withMessage('stock invalido'),
    check('category').not().isEmpty().withMessage('la categoria es requerida'),
    check('subcategory').not().isEmpty().withMessage('la subcategoria es requerida'),
];


/***RUTAS****/

// POST /api/products - Crear producto
router.post('/',
    verifyToken,
    checkPermission('productos.crear'),
    validateProduct,
    productController.createProduct
);

// GET /api/products - obtener todos los productos 
router.get('/',
    verifyToken,
    checkPermission('productos.ver'),
    productController.getProducts
);

// GET /api/products - obtener producto por id 
router.get('/:id',
    verifyToken,
    checkPermission('productos.ver'),
    productController.getProductById
);

// PUT /api/products - actualizar producto por id 
router.put('/:id',
    verifyToken,
    checkPermission('productos.editar'),
    validateProduct, productController.updateProduct
);

// PATCH /api/products/:id/deactivate - desactivar producto 
router.patch('/:id/deactivate',
    verifyToken,
    checkPermission('productos.inactivar'),
    productController.deactivateProduct
);

// PATCH /api/products/:id/activate - activar producto
router.patch('/:id/activate',
    verifyToken,
    checkPermission('productos.inactivar'),
    productController.activateProduct
);




module.exports = router;