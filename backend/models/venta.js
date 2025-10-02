const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ventaSchema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  productos: [
    {
      producto:{ type: Schema.Types.ObjectId, ref: 'Product', required: true },
      cantidad: { type: Number, required: true },
      precioUnitario: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  estado: {
  type: String,
  enum: ['completado', 'pendiente', 'devuelta', 'anulado'],
  default: 'completado'
},


  // 👇 Campo adicional para vincular con el pedido original
  pedidoReferenciado: { type: Schema.Types.ObjectId, ref: 'Pedido' }
});

module.exports = mongoose.model('Venta', ventaSchema);
