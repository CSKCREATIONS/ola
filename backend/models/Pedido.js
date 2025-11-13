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
  remisionGenerada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Remision'
  },

  fechaEntrega: { type: Date, required: true },
  observacion: { type: String, default: '' },
  motivoDevolucion: { type: String, default: '' },
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