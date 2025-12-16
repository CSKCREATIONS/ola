const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VentaProductoSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Products', required: true },
  cantidad: { type: Number, default: 1 },
  precioUnitario: { type: Number, default: 0 }
}, { _id: false });

const VentaSchema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: false },
  productos: { type: [VentaProductoSchema], default: [] },
  total: { type: Number, default: 0 },
  fecha: { type: Date, default: Date.now },
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: false }
}, {
  timestamps: true,
  collection: 'ventas'
});

module.exports = mongoose.model('Venta', VentaSchema);
