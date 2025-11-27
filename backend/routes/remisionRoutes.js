const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');
const remisionController = require('../controllers/remisionController');
const pedidoController = require('../controllers/pedidoControllers');

// Obtener todas las remisiones
router.get('/',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.getAllRemisiones
);

// Obtener estadísticas de remisiones
router.get('/estadisticas',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.getEstadisticasRemisiones
);

// Crear remisión
router.post('/',
  verifyToken,
  checkPermission('remisiones.crear'),
  remisionController.createRemision
);



// Obtener una remisión por ID
router.get('/:id',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.getRemisionById
);

// Enviar remisión por correo
router.post('/:id/enviar-remision',
  verifyToken,
  checkPermission('remisiones.enviar'),
  remisionController.enviarRemisionPorCorreo
);



// Eliminar remisión
router.delete('/:id',
  verifyToken,
  checkPermission('remisiones.eliminar'),
  remisionController.deleteRemision
);

module.exports = router;