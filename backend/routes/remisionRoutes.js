const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');
const remisionController = require('../controllers/remisionController');

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

// Verificar configuración de correo (para debugging)
router.get('/config-correo',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.verificarConfiguracionCorreo
);

// Probar SendGrid (para debugging)
router.post('/probar-sendgrid',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.probarSendGrid
);

// Probar Gmail SMTP (para debugging)
router.post('/probar-gmail',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.probarGmail
);

// Obtener una remisión por ID
router.get('/:id',
  verifyToken,
  checkPermission('remisiones.ver'),
  remisionController.getRemisionById
);

// Enviar remisión por correo
router.post('/:id/enviar-correo',
  verifyToken,
  checkPermission('remisiones.crear'),
  remisionController.enviarRemisionPorCorreo
);

// Actualizar estado de remisión
router.patch('/:id/estado',
  verifyToken,
  checkPermission('remisiones.editar'),
  remisionController.updateEstadoRemision
);

// Eliminar remisión
router.delete('/:id',
  verifyToken,
  checkPermission('remisiones.eliminar'),
  remisionController.deleteRemision
);

module.exports = router;