const mongoose = require('mongoose');

const CotizacionSchema = new mongoose.Schema({
  codigo: String,
  cliente: {
    referencia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
    nombre: String,
    ciudad: String,
    direccion: String,
    telefono: String,
    correo: String,
    esCliente: Boolean
  },
  responsable: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    firstName: String,
    secondName: String,
    surname: String,
    secondSurname: String
  },
  fecha: {
    type: Date,
    required: true
  },
  descripcion: String,
  condicionesPago: String,
  productos: [
    {
      producto: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        name: String
      },
      descripcion: String,
      cantidad: Number,
      valorUnitario: Number,
      descuento: Number,
      subtotal: Number
    }
  ],
  empresa: {
    nombre: { type: String },
    direccion: { type: String }
  },
  clientePotencial: {
    type: Boolean,
    default: false
  },
  enviadoCorreo: {
    type: Boolean,
    default: false
  },
  agendada: {
    type: Boolean,
    default: false
  },
  pedidoReferencia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cotizacion', CotizacionSchema);