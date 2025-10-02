const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  secondName: {
    type: String,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  secondSurname: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false // No devolver el password en las consultas
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true,
      'El rol es requerido']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  // models/User.js
  mustChangePassword: {
    type: Boolean,
    default: true
  },
    lastLogin: {
    type: Date,
    default: null
  },
  provisional: {
  type: Boolean,
  default: false
}

}, { timestamps: true });

// Middleware para hashear la contraseña antes de guardar

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);