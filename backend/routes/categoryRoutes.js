const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role')



// POST /api/categories - Crear categoria 
router.post('/',
    verifyToken,
    checkPermission('categorias.crear'),
    categoryController.createCategory
);

// GET /api/categories - listar las categorias
router.get('/',
    verifyToken,
    checkPermission('categorias.ver'),
    categoryController.getCategories
);

//GET /api/categories - obtener categoria especifica
router.get('/:id',
    verifyToken,
    checkPermission('categorias.ver'),
    categoryController.getCategoryById
);

// PUT /api/categories - modificar categoria especifica 
router.put('/:id',
    verifyToken,
    checkPermission('categorias.editar'),
    categoryController.updateCategory
);


// Acutualizar el estado de las categorias// desactivado
router.patch('/:id/deactivate',
    verifyToken,
    checkPermission('categorias.editar'),
    categoryController.desactivarCategoriaYRelacionados
);
router.patch('/:id/activate',
    verifyToken,
    checkPermission('categorias.editar'),
    categoryController.activarCategoriaYRelacionados
);





module.exports = router;