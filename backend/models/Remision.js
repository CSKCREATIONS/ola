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
    required: true
  },
  codigoPedido: {
    type: String,
    required: true
  },
  cotizacionReferencia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion'
  },
  codigoCotizacion: {
    type: String
  },
  cliente: {
    nombre: String,
    correo: String,
    telefono: String,
    ciudad: String
  },
  productos: [{
    nombre: String,
    cantidad: Number,
    precioUnitario: Number,
    total: Number,
    descripcion: String,
    codigo: String
  }],
  fechaRemision: {
    type: Date,
    default: Date.now
  },
  fechaEntrega: Date,
  observaciones: {
    type: String,
    default: ''
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  estado: {
    type: String,
    enum: ['activa', 'cerrada', 'cancelada'],
    default: 'activa'
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