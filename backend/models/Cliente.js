const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es obligatoria'],
    trim: true
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'El correo debe tener un formato válido']
  },
  esCliente: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
