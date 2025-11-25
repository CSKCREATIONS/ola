const mongoose = require('mongoose');

const RemisionSchema = new mongoose.Schema({
  numeroRemision: {
    type: String,
    required: true,
    unique: true
  },
  pedidoReferencia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: false
  },
  cotizacionReferencia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: false
  },
  // Guarda también el código de la cotización por conveniencia
  cotizacionCodigo: {
    type: String,
    required: false,
  },
  descripcion: {
    type: String,
    default: ''
  },
  
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  productos: [{
    nombre: String,
    cantidad: Number,
    precioUnitario: Number,
    total: Number,
    descripcion: String,
    codigo: String
  }],
  fechaEntrega: Date,
  observaciones: {
    type: String,
    default: ''
  },
  condicionesPago: {
    type: String,
    default: ''
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  cantidadItems: {
    type: Number,
    default: 0
  },
  cantidadTotal: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Índices para búsquedas eficientes
RemisionSchema.index({ estado: 1 });
RemisionSchema.index({ fechaRemision: -1 });
RemisionSchema.index({ 'cliente.nombre': 1 });

module.exports = mongoose.model('Remision', RemisionSchema);