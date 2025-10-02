const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const { check } = require('express-validator');
const { verifyToken } = require('../middlewares/authJwt');
const { checkRole } = require('../middlewares/role');
const { checkPermission } = require('../middlewares/role');

//validaciones
const validateSubcategory = [
    check('name').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('description').not().isEmpty().withMessage('La descripcion es obligatoria'),
    check('category').not().isEmpty().withMessage('la categoria es obligatoria')
];


/***RUTAS****/
//POST /api/subcategories - crear subcategoria
router.post('/',
    verifyToken,
    checkPermission('subcategorias.crear'),
    validateSubcategory, subcategoryController.createSubcategory
);

// GET /api/subcategories -  consultar
router.get('/',
    verifyToken,
    checkPermission('subcategorias.ver'),
    subcategoryController.getSubcategories
);

router.get('/:id',
    verifyToken,
    checkPermission('subcategorias.ver'),
    subcategoryController.getSubcategoryById);

// PUT /api/subcategories - Actualizar subcategoria por id 
router.put('/:id',
    verifyToken,
    checkPermission('subcategorias.editar'),
    validateSubcategory, subcategoryController.updateSubcategory
);


// Actualizar el estado de las categorias// desactivado

router.patch('/:id/deactivate',
    verifyToken,
    checkPermission('subcategorias.inactivar'),
    subcategoryController.desactivarSubcategoriaYProductos
);
router.patch('/:id/activate',
     verifyToken,
     checkPermission('subcategorias.inactivar'),
     subcategoryController.activarSubcategoria
);

module.exports = router;