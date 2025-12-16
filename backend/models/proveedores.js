const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  contacto: {
    telefono: { type: String, required: true },
    correo: { type: String, required: true }
  },
  direccion: {
    calle: { type: String, required: true },
    pais: { type: String, required: true }
  },
  empresa: { type: String },
  productos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now }
},{ timestamps: true });

module.exports = mongoose.model('Proveedor', ProveedorSchema);
