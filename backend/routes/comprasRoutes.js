const express = require('express');
const router = express.Router();
const {
  crearCompra,
  obtenerComprasPorProveedor,
  obtenerTodasLasCompras,
  actualizarCompra,
  eliminarCompra,
  enviarCompraPorCorreo

} = require('../controllers/compraController');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');


router.post('/',
  crearCompra,
  verifyToken,
  checkPermission('compras.crear'),
);

router.get('/',
  verifyToken,
  checkPermission('compras.ver'),
  obtenerTodasLasCompras
);

router.get('/proveedor/:id',
  verifyToken,
  obtenerComprasPorProveedor
);

router.put('/:id',
  verifyToken,
  actualizarCompra
);

router.delete('/:id',
  verifyToken,
  eliminarCompra
);

router.post('/:id/enviar-email',
  verifyToken,
  enviarCompraPorCorreo
);


module.exports = router;