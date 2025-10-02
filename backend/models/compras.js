// models/Compra.js
const mongoose = require('mongoose');

const CompraSchema = new mongoose.Schema({
  numeroOrden: { type: String, required: true, unique: true },
  proveedor: { type: String, required: true },
  solicitadoPor: { type: String, required: true },
  observaciones: String,
  fecha: { type: Date, default: Date.now },
  productos: [{
    producto: String,
    descripcion: String,
    cantidad: Number,
    precioUnitario: Number
  }],
  subtotal: Number,
  impuestos: Number,
  total: Number,
  estado: { type: String, default: 'Completada' }
});

module.exports = mongoose.model('compras', CompraSchema);