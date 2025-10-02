const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  numeroOrden: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  proveedor: {
    type: String,
    required: true,
    trim: true
  },
  responsable: {
    type: String,
    required: true,
    default: "Sin asignar",
    trim: true
  },
  productos: [
    {
      producto: {
        type: String,
        required: true,
        trim: true
      },
      descripcion: {
        type: String,
        trim: true
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },
      valorUnitario: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      valorTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  impuestos: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  condicionesPago: {
    type: String,
    default: "Contado"
  },
  direccionEntrega: {
    type: String,
    trim: true
  },
  solicitadoPor: {
    type: String,
    trim: true
  },
  fechaOrden: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Completada', 'Cancelada'],
    default: 'Pendiente'
  }
}, {
  timestamps: true
});

// Hook para calcular subtotal, impuestos y total
ordenCompraSchema.pre('save', function(next) {
  if (this.productos && this.productos.length > 0) {
    this.productos.forEach(p => {
      p.valorTotal = p.cantidad * p.valorUnitario;
    });
    this.subtotal = this.productos.reduce((acc, p) => acc + p.valorTotal, 0);
    this.impuestos = this.subtotal * 0.19;
    this.total = this.subtotal + this.impuestos;
  } else {
    this.subtotal = 0;
    this.impuestos = 0;
    this.total = 0;
  }
  next();
});

module.exports = mongoose.model('OrdenCompra', ordenCompraSchema);