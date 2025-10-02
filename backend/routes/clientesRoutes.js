const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const clienteController = require('../controllers/clienteControllers');
const { verifyToken } = require('../middlewares/authJwt');
const { checkRole } = require('../middlewares/role');
const Cliente = require('../models/Cliente');
const { checkPermission } = require('../middlewares/role');

// Validaciones para crear/actualizar cliente
const validateCliente = [
    check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('correo').isEmail().withMessage('Debe proporcionar un correo válido'),
    check('telefono').not().isEmpty().withMessage('El teléfono es obligatorio'),
    check('direccion').not().isEmpty().withMessage('La dirección es obligatoria'),
    check('ciudad').not().isEmpty().withMessage('La ciudad es obligatoria'),

];


// RUTAS

// POST /api/clientes - Crear cliente 
router.post('/',
    verifyToken,
    checkPermission('clientes.crear'),
    validateCliente,
    clienteController.createCliente
);

router.get('/estado-de-clientes',
   verifyToken,
   checkPermission('clientes.ver'),
    clienteController.getClientesConEstado
  );


// GET /api/clientes - Obtener todos los clientes 
router.get('/', 
  verifyToken,
  checkPermission('clientes.ver'),
  clienteController.getClientes
);



// GET /api/clientes/:id - Obtener cliente por ID
router.get('/:id',
    verifyToken,
    checkPermission('clientes.ver'),
    clienteController.getClienteById
);


// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id',
  verifyToken,
  checkPermission('clientes.editar'),
  async (req, res) => {
    try {
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(clienteActualizado);
    } catch (error) {
      console.error('❌ Error al actualizar cliente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);



module.exports = router;