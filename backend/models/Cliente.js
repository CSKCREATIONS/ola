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
    lowercase: true,
    validate: {
      validator: function (email) {
        // Deterministic, low-risk email validation to avoid catastrophic backtracking.
        if (typeof email !== 'string') return false;
        if (email.length === 0 || email.length > 320) return false;
        if (/\s/.test(email)) return false; // no whitespace

        const parts = email.split('@');
        if (parts.length !== 2) return false; // exactly one @

        const [local, domain] = parts;
        if (!local || local.length > 64) return false;
        if (!domain || domain.length > 255) return false;
        if (domain.startsWith('.') || domain.endsWith('.')) return false;
        if (domain.indexOf('.') === -1) return false; // require a dot in domain

        // Domain: only letters, digits, hyphen and dot
        if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;

  // Local: allow common characters but keep it conservative
  // Move hyphen to the end of the class to avoid an unnecessary escape
  if (!/^[A-Za-z0-9!#$%&'*+/?^_`{|}~.-]+$/.test(local)) return false;

        return true;
      },
      message: 'El correo debe tener un formato válido'
    }
  },
  esCliente: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
