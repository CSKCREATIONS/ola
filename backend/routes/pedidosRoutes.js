
const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const { verifyToken } = require('../middlewares/authJwt');
const pedidoController = require('../controllers/pedidoControllers');
const { checkPermission } = require('../middlewares/role');

// Función para generar número de pedido usando Counter
async function generarNumeroPedido() {
  const Counter = require('../models/Counter');
  const counter = await Counter.findByIdAndUpdate(
    'pedido',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PED-${String(counter.seq).padStart(5, '0')}`;
}

//
// === RUTAS ===
//

// Crear pedido - delegamos a pedidoController.createPedido para mantener la lógica en un solo lugar
router.post('/',
  verifyToken,
  checkPermission('pedidos.agendar'),
  pedidoController.createPedido
);


// Obtener todos los pedidos
router.get('/', 
  verifyToken,
  checkPermission('pedidos.ver'),
   pedidoController.getPedidos
  );

  router.get('/:id', 
  verifyToken,
  checkPermission('pedidos.ver'),
   pedidoController.getPedidoById
  );





// Cancelar pedido (marca estado y registra fecha de cancelación)
router.patch('/:id/cancelar', verifyToken, async (req, res) => {
  try {
    // Intentar parsear fecha enviada; si no viene o es inválida, usar ahora
    const fechaRaw = req.body && req.body.fechaCancelacion ? req.body.fechaCancelacion : null;
    let fechaCancelacion = fechaRaw ? new Date(fechaRaw) : new Date();
    if (!(fechaCancelacion instanceof Date) || isNaN(fechaCancelacion)) {
      fechaCancelacion = new Date();
    }

    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado: 'cancelado', fechaCancelacion, responsableCancelacion: req.userId || null },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json({ message: 'Pedido cancelado', pedido });
  } catch (err) {
    console.error('Error al cancelar pedido:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// Enviar pedido agendado por correo
router.post('/:id/enviar-agendado',
  verifyToken,
  checkPermission('pedidos.enviar'),
  pedidoController.enviarPedidoAgendadoPorCorreo
);

// Enviar pedido por correo (general)
router.post('/:id/enviar-correo',
  verifyToken,
  checkPermission('pedidos.enviar'),
  pedidoController.enviarPedidoPorCorreo
);



// Remisionar pedido (crear documento Remision desde un pedido)
router.post('/:id/remisionar',
  verifyToken,
  checkPermission('pedidos.remisionar'),
  pedidoController.remisionarPedido
);


// Enviar pedido cancelado por correo
router.post('/:id/enviar-cancelado',
  verifyToken,
  checkPermission('pedidos.enviar'),
  pedidoController.enviarPedidoCanceladoPorCorreo
);

// Eliminar un pedido cancelado
router.delete('/cancelado/:id',
  verifyToken,
  checkPermission('pedidos.eliminar'),
  pedidoController.deletePedidocancelado
);

// Ruta para probar configuración de correo
router.post('/test-email',
  verifyToken,
  pedidoController.testEmailConfiguration
);

module.exports = router;
