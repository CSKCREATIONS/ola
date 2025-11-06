const mongoose = require('mongoose');
const Counter = require('../models/Counter');
const Pedido = require('../models/Pedido');

require('dotenv').config();

async function synchronizePedidoCounter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Find the highest pedido number and extract the sequence
    const lastPedido = await Pedido.findOne({ numeroPedido: { $exists: true } })
      .sort({ createdAt: -1 })
      .select('numeroPedido');

    let maxSeq = 0;
    if (lastPedido && lastPedido.numeroPedido) {
      // Assuming format PED-00001
      const match = lastPedido.numeroPedido.match(/PED-(\d+)/);
      if (match) {
        maxSeq = parseInt(match[1], 10);
      }
    }

    console.log(`📊 Last pedido sequence: ${maxSeq}`);

    // Update or create the counter
    const result = await Counter.findOneAndUpdate(
      { _id: 'pedido' },
      { $set: { seq: maxSeq } },
      { upsert: true, new: true }
    );

    console.log(`✅ Counter updated: ${result._id} => ${result.seq}`);

  } catch (error) {
    console.error('❌ Error synchronizing counter:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

synchronizePedidoCounter();