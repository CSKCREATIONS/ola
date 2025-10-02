const express = require('express');
const router = express.Router();
const {
  crearOrden,
  listarOrdenes,
  obtenerOrden,
  eliminarOrden,
  completarOrden,
  editarOrden
} = require('../controllers/ordenCompraController');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');

// Crear nueva orden
router.post('/', verifyToken, checkPermission('ordenes.generar'), crearOrden);

// Listar todas las órdenes
router.get('/', verifyToken, checkPermission('ordenesCompra.ver'), listarOrdenes);

// Obtener una orden por ID
router.get('/:id', verifyToken, checkPermission('ordenesCompra.ver'), obtenerOrden);

// Eliminar una orden
router.delete('/:id', verifyToken, checkPermission('ordenes.eliminar'), eliminarOrden);

router.put('/:id', verifyToken, checkPermission('ordenes.editar'), editarOrden);

router.put('/:id/completar', completarOrden);



module.exports = router;