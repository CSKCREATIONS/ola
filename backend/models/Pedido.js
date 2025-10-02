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
  cotizacionCodigo: {
    type: String,
    default: ''
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

  fechaEntrega: { type: Date, required: true },
  observacion: { type: String, default: '' },
  motivoDevolucion: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['agendado', 'despachado', 'entregado', 'cancelado', 'devuelto'],
    default: 'agendado'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  motivoDevolucion: {
    type: String,
    default: ''
  },
}, { timestamps: true });

module.exports = mongoose.models.Pedido || mongoose.model('Pedido', PedidoSchema);