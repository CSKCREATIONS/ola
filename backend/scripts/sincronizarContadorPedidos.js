// Script para sincronizar el contador de pedidos con los datos existentes
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Pedido = require('../models/Pedido');
const Counter = require('../models/Counter');

async function sincronizarContadorPedidos() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar el pedido con el número más alto
    console.log('\n🔍 Buscando el pedido con el número más alto...');
    const pedidos = await Pedido.find({ numeroPedido: { $regex: /^PED-\d+$/ } })
      .sort({ numeroPedido: -1 });

    let maxNumero = 0;
    
    if (pedidos.length > 0) {
      console.log(`📊 Se encontraron ${pedidos.length} pedidos`);
      
      for (const pedido of pedidos) {
        const numeroMatch = pedido.numeroPedido.match(/^PED-(\d+)$/);
        if (numeroMatch) {
          const numero = parseInt(numeroMatch[1]);
          if (numero > maxNumero) {
            maxNumero = numero;
          }
        }
      }
      
      console.log(`🔢 Número de pedido más alto encontrado: PED-${String(maxNumero).padStart(5, '0')}`);
    } else {
      console.log('⚠️  No se encontraron pedidos con formato PED-XXXXX');
    }

    // Actualizar o crear el contador
    console.log('\n🔄 Actualizando contador de pedidos...');
    const counterAnterior = await Counter.findById('pedido');
    
    if (counterAnterior) {
      console.log(`📊 Contador anterior: ${counterAnterior.seq}`);
    } else {
      console.log('📊 No existía contador anterior');
    }

    // Establecer el contador al número más alto + 1
    const nuevoSeq = maxNumero + 1;
    const counterActualizado = await Counter.findByIdAndUpdate(
      'pedido',
      { seq: nuevoSeq },
      { new: true, upsert: true }
    );

    console.log(`✅ Contador actualizado a: ${counterActualizado.seq}`);
    console.log(`🎯 El próximo pedido será: PED-${String(counterActualizado.seq).padStart(5, '0')}`);

    // Verificar contadores existentes
    console.log('\n📋 Estado de todos los contadores:');
    const todosContadores = await Counter.find();
    
    todosContadores.forEach(contador => {
      console.log(`   - ${contador._id}: ${contador.seq}`);
    });

    if (todosContadores.length === 0) {
      console.log('   - No hay contadores configurados');
    }

    console.log('\n✅ Sincronización completada');

  } catch (error) {
    console.error('❌ Error en la sincronización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la sincronización
sincronizarContadorPedidos();