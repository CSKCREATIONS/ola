// Script para crear remisiones de prueba
const mongoose = require('mongoose');
const Remision = require('./models/Remision');
const Pedido = require('./models/Pedido');

async function crearRemisionPrueba() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/pangea');
    console.log('✅ Conexión establecida');

    // Buscar cualquier pedido existente
    const pedidos = await Pedido.find({}).limit(2);
    console.log(`📦 Encontrados ${pedidos.length} pedidos`);

    // Crear remisiones de prueba (con o sin pedidos)
    const remisionesData = [];

    for (let i = 0; i < 2; i++) {
      const pedido = pedidos[i];
      
      const remisionData = {
        numeroRemision: `REM-${String(i + 1).padStart(5, '0')}`,
        pedidoReferencia: pedido?._id || new mongoose.Types.ObjectId(),
        codigoPedido: pedido?.numeroPedido || `PED-TEST-${i + 1}`,
        cliente: {
          nombre: `Cliente Prueba ${i + 1}`,
          correo: `cliente${i + 1}@prueba.com`,
          telefono: `123456789${i}`,
          ciudad: `Ciudad ${i + 1}`
        },
        productos: [{
          nombre: `Producto de Prueba ${i + 1}`,
          cantidad: i + 1,
          precioUnitario: 10000 * (i + 1),
          total: (i + 1) * 10000 * (i + 1),
          descripcion: `Descripción del producto ${i + 1}`,
          codigo: `PROD-${String(i + 1).padStart(3, '0')}`
        }],
        fechaRemision: new Date(),
        fechaEntrega: new Date(),
        observaciones: `Remisión de prueba #${i + 1} generada automáticamente`,
        estado: 'activa',
        total: (i + 1) * 10000 * (i + 1),
        cantidadItems: 1,
        cantidadTotal: i + 1
      };

      remisionesData.push(remisionData);
    }

    // Insertar las remisiones
    const remisionesCreadas = await Remision.insertMany(remisionesData);
    
    console.log(`✅ ${remisionesCreadas.length} remisiones de prueba creadas:`);
    remisionesCreadas.forEach((remision, index) => {
      console.log(`${index + 1}. ID: ${remision._id}`);
      console.log(`   Número: ${remision.numeroRemision}`);
      console.log(`   Estado: ${remision.estado}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

crearRemisionPrueba();