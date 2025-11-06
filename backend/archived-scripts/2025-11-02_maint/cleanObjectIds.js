const mongoose = require('mongoose');
const Cotizacion = require('../models/cotizaciones');
const Pedido = require('../models/Pedido');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const dbConfig = require('../config/db');
mongoose.connect(dbConfig.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanCorruptedObjectIds() {
  console.log('🔍 Iniciando limpieza de ObjectIds corruptos...');
  
  try {
    // Check and fix Cotizaciones
    console.log('\n📋 Verificando Cotizaciones...');
    const cotizaciones = await Cotizacion.find({}).lean();
    
    for (const cotizacion of cotizaciones) {
      let needsUpdate = false;
      const updates = {};
      
      // Check productos array
      if (Array.isArray(cotizacion.productos)) {
        const cleanedProductos = cotizacion.productos.map(producto => {
          if (producto.producto && producto.producto.id) {
            // Check if id is a Buffer or invalid ObjectId
            const productId = producto.producto.id;
            
            if (Buffer.isBuffer(productId)) {
              console.log(`⚠️  Buffer encontrado en cotización ${cotizacion._id}, producto: ${productId}`);
              // Try to convert buffer to string and validate
              try {
                const hexString = productId.toString('hex');
                if (hexString.length === 24 && /^[0-9a-fA-F]{24}$/.test(hexString)) {
                  producto.producto.id = hexString;
                  needsUpdate = true;
                  console.log(`✅ Buffer convertido a ObjectId: ${hexString}`);
                } else {
                  console.log(`❌ Buffer no válido, eliminando producto`);
                  return null; // Will be filtered out
                }
              } catch (error) {
                console.log(`❌ Error procesando buffer: ${error.message}`);
                return null;
              }
            } else if (typeof productId === 'string' && !mongoose.Types.ObjectId.isValid(productId)) {
              console.log(`⚠️  ObjectId inválido encontrado: ${productId}`);
              return null;
            }
          }
          return producto;
        }).filter(p => p !== null);
        
        if (needsUpdate) {
          updates.productos = cleanedProductos;
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await Cotizacion.updateOne({ _id: cotizacion._id }, updates);
        console.log(`✅ Cotización ${cotizacion._id} actualizada`);
      }
    }
    
    // Check and fix Pedidos
    console.log('\n📦 Verificando Pedidos...');
    const pedidos = await Pedido.find({}).lean();
    
    for (const pedido of pedidos) {
      let needsUpdate = false;
      const updates = {};
      
      // Check productos array
      if (Array.isArray(pedido.productos)) {
        const cleanedProductos = pedido.productos.map(producto => {
          if (producto.product) {
            const productId = producto.product;
            
            if (Buffer.isBuffer(productId)) {
              console.log(`⚠️  Buffer encontrado en pedido ${pedido._id}, producto: ${productId}`);
              try {
                const hexString = productId.toString('hex');
                if (hexString.length === 24 && /^[0-9a-fA-F]{24}$/.test(hexString)) {
                  producto.product = hexString;
                  needsUpdate = true;
                  console.log(`✅ Buffer convertido a ObjectId: ${hexString}`);
                } else {
                  console.log(`❌ Buffer no válido, eliminando producto`);
                  return null;
                }
              } catch (error) {
                console.log(`❌ Error procesando buffer: ${error.message}`);
                return null;
              }
            } else if (typeof productId === 'string' && !mongoose.Types.ObjectId.isValid(productId)) {
              console.log(`⚠️  ObjectId inválido encontrado: ${productId}`);
              return null;
            }
          }
          return producto;
        }).filter(p => p !== null);
        
        if (needsUpdate) {
          updates.productos = cleanedProductos;
        }
      }
      
      if (needsUpdate) {
        await Pedido.updateOne({ _id: pedido._id }, updates);
        console.log(`✅ Pedido ${pedido._id} actualizado`);
      }
    }
    
    console.log('\n✅ Limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the cleaning script
if (require.main === module) {
  cleanCorruptedObjectIds();
}

module.exports = cleanCorruptedObjectIds;