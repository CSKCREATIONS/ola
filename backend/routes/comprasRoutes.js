const express = require('express');
const router = express.Router();
const {
  crearCompra,
  obtenerComprasPorProveedor,
  obtenerTodasLasCompras,
  actualizarCompra,
  eliminarCompra

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
  checkPermission('hcompras.ver'),
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


module.exports = router;