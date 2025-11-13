const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authJwt');
const cotizacionController = require('../controllers/cotizacionControllers');
const Cotizacion = require('../models/cotizaciones'); // ajusta la ruta si es diferente
const Product = require('../models/Products'); // Ensure Product model is loaded
const { checkPermission } = require('../middlewares/role');
const { validateObjectIdParam, isValidObjectId } = require('../utils/objectIdValidator');

// ✅ Crear cotización
router.post('/',
  verifyToken,
  checkPermission('cotizaciones.crear'),
  cotizacionController.createCotizacion
);

// Obtener la cotización más reciente de un cliente por su ID (cliente _id)
router.get('/cliente/:id',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  validateObjectIdParam('id'),
  async (req, res) => {
    try {
      // Sanitizar el ID del cliente para prevenir inyección NoSQL
      const clienteId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
      
      if (!clienteId || !clienteId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'ID de cliente inválido' });
      }

      const cotizacion = await Cotizacion.findOne({ 'cliente.referencia': clienteId })
        .sort({ createdAt: -1 }) // más reciente
        .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
        .populate({
          path: 'productos.producto.id',
          model: 'Product',
          select: 'name price description',
          options: { strictPopulate: false }
        });

      if (!cotizacion) {
        return res.status(404).json({ message: 'No se encontró cotización para este cliente' });
      }

      // Process the cotization to ensure product data is properly structured
      const cotObj = cotizacion.toObject();
      if (Array.isArray(cotObj.productos)) {
        cotObj.productos = cotObj.productos.map(p => {
          if (p.producto && p.producto.id) {
            // Handle both populated and non-populated product data
            if (typeof p.producto.id === 'object' && p.producto.id.name) {
              // Populated data
              p.producto.name = p.producto.id.name || p.producto.name;
              p.producto.price = p.producto.id.price || p.producto.price;
              p.producto.description = p.producto.id.description || p.producto.description;
            }
          }
          return p;
        });
      }

      res.json(cotObj);
    } catch (err) {
      console.error('Error al obtener cotización:', err);
      
      // Handle specific casting errors
      if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ 
          message: 'Error en formato de datos del cliente',
          error: 'CAST_ERROR'
        });
      }
      
      res.status(500).json({ message: 'Error al obtener cotización' });
    }
  }
);

router.get('/ultima',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  cotizacionController.getUltimaCotizacionPorCliente
);

router.get('/',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  async (req, res) => {
    try {
      // First, try to get cotizaciones without populate to avoid casting errors
      let cotizaciones;
      
      try {
        cotizaciones = await Cotizacion.find()
          .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
          .populate({
            path: 'productos.producto.id',
            model: 'Product',
            select: 'name price description',
            options: { strictPopulate: false } // Allow population even if some refs are missing
          })
          .sort({ createdAt: -1 });
      } catch (populateError) {
        console.warn('Error with populate, fetching without product population:', populateError.message);
        
        // Fallback: get cotizaciones without product population
        cotizaciones = await Cotizacion.find()
          .populate('cliente.referencia', 'nombre correo telefono ciudad esCliente')
          .sort({ createdAt: -1 });
      }

      // Process each cotization to ensure product data is properly structured
      const processedCotizaciones = cotizaciones.map(cotizacion => {
        const cotObj = cotizacion.toObject();
        if (Array.isArray(cotObj.productos)) {
          cotObj.productos = cotObj.productos.map(p => {
            if (p.producto && p.producto.id) {
              // Handle both populated and non-populated product data
              if (typeof p.producto.id === 'object' && p.producto.id.name) {
                // Populated data
                p.producto.name = p.producto.id.name || p.producto.name;
                p.producto.price = p.producto.id.price || p.producto.price;
                p.producto.description = p.producto.id.description || p.producto.description;
              }
              // If not populated or missing, keep original name
            }
            return p;
          });
        }
        return cotObj;
      });

      res.json(processedCotizaciones);
    } catch (err) {
      console.error('[ERROR getCotizaciones]', err);
      
      // Handle specific casting errors
      if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ 
          message: 'Error en formato de datos de las cotizaciones',
          error: 'CAST_ERROR'
        });
      }
      
      res.status(500).json({ message: 'Error al obtener cotizaciones' });
    }
  }
);



// ✅ Obtener todas las cotizaciones con populate
// Obtener todas las cotizaciones


// GET /api/cotizaciones/:id
router.get('/:id',
  verifyToken,
  checkPermission('cotizaciones.ver'),
  validateObjectIdParam('id'),
  async (req, res) => {
    try {
      const cotizacion = await Cotizacion.findById(req.params.id)
        .populate('cliente.referencia', 'nombre correo ciudad telefono esCliente')
        .populate({
          path: 'productos.producto.id',
          model: 'Product',
          select: 'name price description',
          options: { strictPopulate: false } // Allow population even if some refs are missing
        });

      if (!cotizacion) {
        return res.status(404).json({ message: 'Cotización no encontrada' });
      }

      // Process the cotization to ensure product data is properly structured
      const cotObj = cotizacion.toObject();
      if (Array.isArray(cotObj.productos)) {
        cotObj.productos = cotObj.productos.map(p => {
          if (p.producto && p.producto.id) {
            // Handle both populated and non-populated product data
            if (typeof p.producto.id === 'object' && p.producto.id.name) {
              // Populated data
              p.producto.name = p.producto.id.name || p.producto.name;
              p.producto.price = p.producto.id.price || p.producto.price;
              p.producto.description = p.producto.id.description || p.producto.description;
            }
            // If not populated or missing, keep original name
          }
          return p;
        });
      }

      res.json(cotObj);
    } catch (err) {
      console.error('Error al buscar cotización:', err);
      
      // Handle specific casting errors
      if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ 
          message: 'Error en formato de datos de la cotización',
          error: 'CAST_ERROR'
        });
      }
      
      res.status(500).json({ message: 'Error al obtener la cotización' });
    }
  }
);


// ✅ Actualizar cotización
router.put('/:id',
  verifyToken,
    checkPermission('cotizaciones.editar'),
  cotizacionController.updateCotizacion
);





// ✅ Eliminar cotización
router.delete('/:id',
  verifyToken,
    checkPermission('cotizaciones.eliminar'),
  cotizacionController.deleteCotizacion // Usa el controlador si ya lo tienes
);

// ✅ Enviar cotización por correo
router.post('/:id/enviar-correo',
  verifyToken,
  checkPermission('cotizaciones.enviar'),
  cotizacionController.enviarCotizacionPorCorreo
);

// ✅ Remisionar cotización (convertir a pedido)
router.post('/:id/remisionar',
  verifyToken,
  checkPermission('cotizaciones.remisionar'),
  cotizacionController.remisionarCotizacion
);

module.exports = router;