const mongoose = require('mongoose');
const config = require('./config');

// Create test pedido for remision testing
async function createTestPedido() {
  try {
    await mongoose.connect(config.DB.URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const Pedido = require('./models/Pedido');
    
    // Check if test pedido already exists
    const existingPedido = await Pedido.findOne({ numeroPedido: 'PED-TEST-001' });
    
    if (existingPedido) {
      console.log('📋 Test pedido already exists:', existingPedido._id);
      console.log('🔗 Use this ID for testing:', existingPedido._id.toString());
      return existingPedido._id;
    }
    
    // Create test pedido
    const testPedido = new Pedido({
      numeroPedido: 'PED-TEST-001',
      cliente: new mongoose.Types.ObjectId(),
      productos: [{
        product: new mongoose.Types.ObjectId(),
        cantidad: 10,
        precioUnitario: 25.50
      }],
      subtotal: 255.00,
      impuestos: 48.45,
      total: 303.45,
      estado: 'entregado',
      fechaCreacion: new Date(),
      fechaEntrega: new Date()
    });
    
    const saved = await testPedido.save();
    console.log('🆕 Created test pedido:', saved._id);
    console.log('🔗 Use this ID for testing:', saved._id.toString());
    
    return saved._id;
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestPedido();