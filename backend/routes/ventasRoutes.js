const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventasControllers');
const { verifyToken } = require('../middlewares/authJwt');
const Venta = require('../models/venta');
const { checkPermission } = require('../middlewares/role');


router.post('/',
  verifyToken,
  checkPermission('ventas.crear'),
  ventaController.crearVenta
);

router.get('/:id', ventaController.obtenerVentaPorId);


router.get('/',
  verifyToken,
  checkPermission('listaDeVentas.ver'),
  async (req, res) => {
    try {
      const ventas = await Venta.find()
        .populate('cliente')
        .sort({ fecha: -1 }); // orden descendente por fecha
      res.json(ventas);
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      res.status(500).json({ message: 'Error al obtener ventas' });
    }
  });



router.delete('/:id', verifyToken, ventaController.eliminarVenta);

module.exports = router;