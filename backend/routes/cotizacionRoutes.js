const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');
const { validateObjectIdParam } = require('../utils/objectIdValidator');
const { normalizeCotizacionProductos } = require('../utils/normalize');
const cotizacionController = require('../controllers/cotizacionControllers');
const Cotizacion = require('../models/cotizaciones');
const Product = require('../models/Products');

// ========================================
// HELPERS
// ========================================

/**
 * Normaliza un documento de Cotización para asegurar que cada producto
 * tenga name, price, description desde el populate
 */
function normalizeCotizacion(cotizacionDoc) {
  if (!cotizacionDoc) return cotizacionDoc;
  
  const cotObj = (typeof cotizacionDoc.toObject === 'function') 
    ? cotizacionDoc.toObject() 
    : structuredClone(cotizacionDoc);
  
  cotObj.productos = normalizeCotizacionProductos(cotObj.productos);
  return cotObj;
}

/**
 * Configuración estándar de populate para productos
 */
const PRODUCTO_POPULATE_CONFIG = {
  path: 'productos.producto.id',
  model: 'Product',
  select: 'name price description',
  options: { strictPopulate: false }
};

/**
 * Maneja errores comunes de Mongoose
 */
function handleMongooseError(err, res, customMessage = 'Error en la operación') {
  console.error(`[ERROR] ${customMessage}:`, err);
  
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ 
      message: 'Formato de ID inválido',
      error: 'CAST_ERROR'
    });
  }
  
  return res.status(500).json({ message: customMessage });
}

// ========================================
// ROUTES
// ========================================

// Crear cotización
router.post('/',
  verifyToken,
  checkPermission('cotizaciones.crear'),
  cotizacionController.createCotizacion
);

// Obtener todas las cotizaciones
router.get('/',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  async (req, res) => {
    try {
      let cotizaciones;
      
      try {
        cotizaciones = await Cotizacion.find()
          .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
          .populate(PRODUCTO_POPULATE_CONFIG)
          .sort({ createdAt: -1 });
      } catch (populateError) {
        console.warn('Error al popular productos, continuando sin ellos:', populateError.message);
        
        cotizaciones = await Cotizacion.find()
          .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
          .sort({ createdAt: -1 });
      }

      const processedCotizaciones = cotizaciones.map(normalizeCotizacion);
      return res.json(processedCotizaciones);
    } catch (err) {
      return handleMongooseError(err, res, 'Error al obtener cotizaciones');
    }
  }
);

// Obtener última cotización por cliente
router.get('/ultima',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  cotizacionController.getUltimaCotizacionPorCliente
);

// Obtener cotización más reciente de un cliente específico
router.get('/cliente/:id',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  validateObjectIdParam('id'),
  async (req, res) => {
    try {
      const clienteId = typeof req.params.id === 'string' 
        ? req.params.id.trim() 
        : '';

      if (!/^[0-9a-fA-F]{24}$/.exec(clienteId)) {
        return res.status(400).json({ message: 'ID de cliente inválido' });
      }

      const cotizacion = await Cotizacion.findOne({ 'cliente.referencia': clienteId })
        .sort({ createdAt: -1 })
        .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
        .populate(PRODUCTO_POPULATE_CONFIG);

      if (!cotizacion) {
        return res.status(404).json({ 
          message: 'No se encontró cotización para este cliente' 
        });
      }

      const result = normalizeCotizacion(cotizacion);
      return res.json(result);
    } catch (err) {
      return handleMongooseError(err, res, 'Error al obtener cotización del cliente');
    }
  }
);

// Obtener cotización por ID
router.get('/:id',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  validateObjectIdParam('id'),
  async (req, res) => {
    try {
      const cotizacion = await Cotizacion.findById(req.params.id)
        .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
        .populate(PRODUCTO_POPULATE_CONFIG);

      if (!cotizacion) {
        return res.status(404).json({ message: 'Cotización no encontrada' });
      }

      const result = normalizeCotizacion(cotizacion);
      return res.json(result);
    } catch (err) {
      return handleMongooseError(err, res, 'Error al obtener la cotización');
    }
  }
);

// Actualizar cotización
router.put('/:id',
  verifyToken,
  checkPermission('cotizaciones.editar'),
  cotizacionController.updateCotizacion
);

// Eliminar cotización
router.delete('/:id',
  verifyToken,
  checkPermission('cotizaciones.eliminar'),
  cotizacionController.deleteCotizacion
);

// Enviar cotización por correo
router.post('/:id/enviar-correo',
  verifyToken,
  checkPermission('cotizaciones.enviar'),
  cotizacionController.enviarCotizacionPorCorreo
);

// Remisionar cotización (convertir a pedido)
router.post('/:id/remisionar',
  verifyToken,
  checkPermission('cotizaciones.remisionar'),
  cotizacionController.remisionarCotizacion
);

module.exports = router;
