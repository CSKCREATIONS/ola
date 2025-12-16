const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  numeroPedido: {
    type: String,
    unique: true,
    required: true
  },
  cotizacionReferenciada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
  },
  descripcion: {
    type: String, default: ''
  },
  productos: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    cantidad: Number,
    precioUnitario: {
      type: Number,
      required: true
    }
  }],
  condicionesPago: {
    type: String, default: ''
  },
  remisionGenerada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Remision'
  },
  fechaAgendamiento: { type: Date},
  fechaCancelacion: { type: Date},
  responsableCancelacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fechaEntrega: { type: Date},
  observacion: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['agendado', 'entregado', 'cancelado'],
    default: 'agendado'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.models.Pedido || mongoose.model('Pedido', PedidoSchema);